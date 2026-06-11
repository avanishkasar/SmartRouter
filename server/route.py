import osmnx as ox
import networkx as nx
import itertools
import numpy as np
from shapely.geometry import LineString

# Load the Mumbai network graph
G = ox.load_graphml("route/mumbai_road_network.graphml")
G = ox.add_edge_speeds(G)  # Adds speed limit data
G = ox.add_edge_travel_times(G)  # Adds estimated travel time for edges

# Warehouse Location (Latitude, Longitude)
warehouse_location = (19.116458, 72.902696) 
warehouse_node = ox.distance.nearest_nodes(G, warehouse_location[1], warehouse_location[0])

# Define rail freight junctions (node ID on G, coordinates, Yard name)
RAIL_JUNCTIONS = [
    (1367093348, (19.0667, 72.8833), "Kurla Yard"),
    (1078664358, (19.2372, 73.1256), "Kalyan Yard"),
    (632348038, (18.9501, 72.9469), "JNPT Port")
]

def get_nearest_rail_junction(lat, lon):
    """Finds the nearest rail yard coordinates and node ID."""
    dists = [((lat - j[1][0])**2 + (lon - j[1][1])**2, j) for j in RAIL_JUNCTIONS]
    return min(dists, key=lambda x: x[0])[1]

def optimal_route(delivery_locations, weights=None, intermodal=False):
    delivery_nodes = [ox.distance.nearest_nodes(G, lon, lat) for lat, lon in delivery_locations]
    # Combine warehouse + delivery nodes
    all_nodes = [warehouse_node] + delivery_nodes

    # Compute shortest paths between all locations
    distance_matrix = {}
    shortest_paths = {}
    
    for i in range(len(all_nodes)):
        for j in range(len(all_nodes)):
            if i != j:
                # Direct road path length and nodes
                direct_len = nx.shortest_path_length(G, all_nodes[i], all_nodes[j], weight="length")
                direct_path = nx.shortest_path(G, all_nodes[i], all_nodes[j], weight="length")
                
                # Default to road routing
                shortest_paths[(i, j)] = (direct_path, False, None)
                distance_matrix[(i, j)] = direct_len

                # Intermodal path check (only if enabled, destination j is an order, and weight > 20 kg)
                if intermodal and j > 0 and weights and len(weights) >= j and weights[j-1] > 20:
                    lat_u = G.nodes[all_nodes[i]]['y']
                    lon_u = G.nodes[all_nodes[i]]['x']
                    lat_v = G.nodes[all_nodes[j]]['y']
                    lon_v = G.nodes[all_nodes[j]]['x']
                    
                    yard_u_node, yard_u_coord, _ = get_nearest_rail_junction(lat_u, lon_u)
                    yard_v_node, yard_v_coord, _ = get_nearest_rail_junction(lat_v, lon_v)
                    
                    if yard_u_node != yard_v_node:
                        # Calculate intermodal path distance
                        len_road1 = nx.shortest_path_length(G, all_nodes[i], yard_u_node, weight="length")
                        len_rail = nx.shortest_path_length(G, yard_u_node, yard_v_node, weight="length")
                        len_road2 = nx.shortest_path_length(G, yard_v_node, all_nodes[j], weight="length")
                        
                        # Apply 0.1x coefficient to rail segment cost
                        intermodal_len = len_road1 + (len_rail * 0.1) + len_road2
                        
                        if intermodal_len < direct_len:
                            # Reconstruct segment paths
                            path_road1 = nx.shortest_path(G, all_nodes[i], yard_u_node, weight="length")
                            path_rail = nx.shortest_path(G, yard_u_node, yard_v_node, weight="length")
                            path_road2 = nx.shortest_path(G, yard_v_node, all_nodes[j], weight="length")
                            
                            shortest_paths[(i, j)] = ((path_road1, path_rail, path_road2), True, (yard_u_coord, yard_v_coord))
                            distance_matrix[(i, j)] = intermodal_len

    # Function to get the distance between two nodes
    def get_distance(u, v):
        return distances.get((u, v), float('inf'))

    # Function to calculate the shortest path using dynamic programming (TSP)
    def tsp(nodes):
        n = len(nodes)
        dp = {}
        parent = {}

        def dp_rec(mask, last):
            if mask == (1 << n) - 1:  # All nodes have been visited
                return get_distance(last, 0)

            if (mask, last) in dp:
                return dp[(mask, last)]

            best_cost = float('inf')
            for i in range(n):
                if mask & (1 << i) == 0:  # If node i hasn't been visited
                    new_mask = mask | (1 << i)
                    cost = get_distance(nodes[last], nodes[i]) + dp_rec(new_mask, i)
                    if cost < best_cost:
                        best_cost = cost
                        parent[(mask, last)] = i

            dp[(mask, last)] = best_cost
            return best_cost

        start_mask = 1
        result = dp_rec(start_mask, 0)

        path = []
        mask = start_mask
        last = 0
        while (mask, last) in parent:
            next_node = parent[(mask, last)]
            path.append(nodes[next_node])
            mask |= (1 << next_node)
            last = next_node

        path.append(0)
        return result, path
    
    distances = distance_matrix
    nodes = sorted(list(set(itertools.chain(*distances.keys()))))

    shortest_distance, shortest_path = tsp(nodes)
    if len(shortest_path) > 1:
        shortest_path = [0] + shortest_path

    optimized_route = [all_nodes[i] for i in shortest_path]
    full_route_latlon = []
    rail_segments = []

    def get_path_coords(path):
        """Extract coordinates along a node path."""
        coords = []
        for u, v in zip(path[:-1], path[1:]):
            if G.has_edge(u, v):
                edge_data = G.get_edge_data(u, v)
                if isinstance(edge_data, dict):
                    edge_data = list(edge_data.values())[0]
                if "geometry" in edge_data:
                    line: LineString = edge_data["geometry"]
                    coords.extend(list(zip(line.xy[1], line.xy[0])))
                else:
                    lat1, lon1 = G.nodes[u]['y'], G.nodes[u]['x']
                    lat2, lon2 = G.nodes[v]['y'], G.nodes[v]['x']
                    for j in np.linspace(0, 1, 10):
                        coords.append((lat1 * (1 - j) + lat2 * j, lon1 * (1 - j) + lon2 * j))
        return coords

    for i in range(len(optimized_route) - 1):
        start, end = optimized_route[i], optimized_route[i + 1]
        idx_start = all_nodes.index(start)
        idx_end = all_nodes.index(end)
        
        path_data, is_intermodal, rail_coords = shortest_paths[(idx_start, idx_end)]
        
        if not is_intermodal:
            # Regular road path
            full_route_latlon.extend(get_path_coords(path_data))
        else:
            # Intermodal path (Road 1 -> Rail -> Road 2)
            path_road1, path_rail, path_road2 = path_data
            
            # Add Road 1 points
            full_route_latlon.extend(get_path_coords(path_road1))
            
            # Add Rail points and collect them as a rail segment
            rail_points = get_path_coords(path_rail)
            full_route_latlon.extend(rail_points)
            rail_segments.append(rail_points)
            
            # Add Road 2 points
            full_route_latlon.extend(get_path_coords(path_road2))

    # Add the final node's lat/lon to the route
    final_lat, final_lon = G.nodes[optimized_route[-1]]['y'], G.nodes[optimized_route[-1]]['x']
    full_route_latlon.append((final_lat, final_lon))

    def compute_route_distances(shortest_route, distance_matrix):
        route_distances = []
        distance = 0
        for i in range(len(shortest_route) - 1):
            start = shortest_route[i]
            end = shortest_route[i + 1]
            distance += distance_matrix.get((start, end), 0)
            route_distances.append(round(distance / 1000, 2))
        return route_distances
        
    distances = compute_route_distances(shortest_path, distance_matrix)
    
    # Format rail segments as a list of lists of dictionaries for JSON serialization
    formatted_rail_segments = [
        [{"lat": float(lat), "lng": float(lng)} for lat, lng in segment]
        for segment in rail_segments
    ]
    
    return full_route_latlon, shortest_path, distances, formatted_rail_segments
