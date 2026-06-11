import { API_BASE_URL } from '../config';
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix for default Leaflet icon issues in React/Vite
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom Leaflet icon for Warehouse (green)
const WarehouseIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const GoogleMapComponent = ({ routeData }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const polylineRef = useRef(null);
  const [orders, setOrders] = useState([]);

  const warehouseCoordinates = [19.116458, 72.902696];

  // 1. Initialize map instance once
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Create map
      const map = L.map(mapContainerRef.current).setView(warehouseCoordinates, 13);
      
      // Add tile layer (CartoDB Dark Matter)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      // Create a layer group to hold all dynamic markers
      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      mapInstanceRef.current = map;
    }
  }, []);

  // 2. Fetch orders whenever routeData changes
  useEffect(() => {
    if (routeData?.assigned_orders?.length) {
      fetchOrders(routeData.assigned_orders);
    } else {
      setOrders([]);
    }
  }, [routeData]);

  const fetchOrders = async (orderIds) => {
    try {
      const fetchedOrders = await Promise.all(
        orderIds.map(async (id) => {
          const response = await fetch(`http://127.0.0.1:8000/orders/${id}`);
          return response.json();
        })
      );
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // 3. Draw routes and markers on map whenever routePath or orders change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Clear previous dynamic layers
    layerGroup.clearLayers();
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    // Determine route path coordinates
    let path = [];
    if (routeData?.full_route) {
      path = routeData.full_route.map(pt => [pt.lat, pt.lng]);
    } else {
      path = [warehouseCoordinates];
    }

    // Add Warehouse Marker
    const warehouseMarker = L.marker(warehouseCoordinates, { icon: WarehouseIcon })
      .bindPopup(`
        <div style="color: #1f2937; font-family: sans-serif;">
          <h3 style="margin: 0; font-weight: bold; font-size: 14px;">Central Warehouse</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4b5563;">Base Location (Mumbai)</p>
        </div>
      `);
    layerGroup.addLayer(warehouseMarker);

    // Add Order Markers
    orders.forEach((order) => {
      const coords = order.delivery_coordinates.split(",").map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const orderMarker = L.marker(coords, { icon: DefaultIcon })
          .bindPopup(`
            <div style="color: #1f2937; font-family: sans-serif; min-width: 140px;">
              <h3 style="margin: 0 0 6px 0; font-weight: bold; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">${order.name}</h3>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Priority:</strong> Level ${order.priority}</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Weight:</strong> ${order.weight} kg</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Status:</strong> ${order.status}</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Distance:</strong> ${order.delivery_distance} km</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #ea580c; font-weight: 500;"><strong>ETA:</strong> ${order.estimate_delivery_time || "Pending"}</p>
            </div>
          `);
        layerGroup.addLayer(orderMarker);
      }
    });

    // Draw route line
    if (path.length > 1) {
      const polyline = L.polyline(path, { color: "#FF5722", weight: 4, opacity: 0.8 }).addTo(map);
      polylineRef.current = polyline;
      // Fit map bounds to show entire route
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    } else {
      map.setView(warehouseCoordinates, 13);
    }
  }, [routeData, orders]);

  return (
    <div className="w-full">
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg relative z-10" 
        style={{ height: "60vh", width: "100%" }}
      >
      </div>

      {/* Orders List */}
      <div className="p-6 bg-gray-800 rounded-lg shadow-md mt-6">
        <h1 className="text-3xl font-bold text-orange-400 mb-4">Assigned Orders</h1>
        {orders.length === 0 ? (
          <p className="text-gray-300">No orders assigned</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
                <p className="text-lg font-semibold text-white mb-2">
                  {order.name}
                </p>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><strong>Priority:</strong> <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.priority === 1 ? 'bg-red-500/20 text-red-400' : order.priority === 2 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>Level {order.priority}</span></p>
                  <p><strong>Weight:</strong> {order.weight} kg</p>
                  <p><strong>Status:</strong> <span className="text-blue-400 font-medium capitalize">{order.status}</span></p>
                  <p><strong>Distance:</strong> {order.delivery_distance} km</p>
                  <p className="text-orange-400 font-medium"><strong>Estimated Delivery:</strong> {order.estimate_delivery_time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleMapComponent;
