import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import Navbar from "../components/Navbar";
import L from "leaflet";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { 
  Truck, 
  Play, 
  CheckCircle, 
  MapPin, 
  Navigation, 
  Gauge, 
  Clock, 
  Milestone,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

// Custom Leaflet icons
const WarehouseIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const DeliveryIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const TruckIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: markerShadow,
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -40],
  shadowSize: [41, 41]
});

const DriverPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Simulation states
  const [transitActive, setTransitActive] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [eta, setEta] = useState("");
  const [logs, setLogs] = useState([]);
  
  // Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const truckMarkerRef = useRef(null);
  const simulationIntervalRef = useRef(null);

  const warehouseCoordinates = [19.116458, 72.902696];

  // Fetch available vehicles on load
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/vehicles/`);
        if (response.ok) {
          const data = await response.json();
          setVehicles(data);
        }
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError("Failed to fetch fleet list.");
      }
    };
    fetchVehicles();
  }, []);

  // Fetch route details when vehicle selected
  const handleVehicleSelect = async (vehicleId) => {
    setSelectedVehicle(vehicleId);
    if (!vehicleId) {
      setRouteData(null);
      return;
    }
    
    setLoading(true);
    setError("");
    // Clear existing simulation
    stopSimulation();
    
    try {
      const response = await fetch(`${API_BASE_URL}/driver/vehicle/${vehicleId}`);
      if (response.ok) {
        const data = await response.json();
        setRouteData(data);
        setDistanceRemaining(data.route_distance);
        setEta(`${Math.round(data.route_distance * 2)} mins`);
        addLog(`📋 Route loaded for Vehicle #${vehicleId}. Total stops: ${data.orders.length}.`);
      } else {
        setRouteData(null);
        setError("No active deliveries scheduled for this vehicle.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load route data.");
    } finally {
      setLoading(false);
    }
  };

  const addLog = (text) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev].slice(0, 15));
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setTransitActive(false);
    setSpeed(0);
  };

  // Setup Leaflet map once routeData is loaded
  useEffect(() => {
    if (routeData && mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(warehouseCoordinates, 13);
      
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    // Update map overlays whenever routeData changes
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (map && layerGroup && routeData) {
      layerGroup.clearLayers();
      
      // Draw road route line
      let roadPath = [];
      if (routeData.full_route && routeData.full_route.length > 0) {
        roadPath = routeData.full_route.map(pt => [pt.lat, pt.lng]);
        const polyline = L.polyline(roadPath, { color: "#FF5722", weight: 4, opacity: 0.8 }).addTo(layerGroup);
        map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
      }

      // Draw rail segments if any
      if (routeData.rail_segments && routeData.rail_segments.length > 0) {
        routeData.rail_segments.forEach((segment) => {
          const coords = segment.map(pt => [pt.lat, pt.lng]);
          L.polyline(coords, {
            color: "#FFD700",
            weight: 5,
            dashArray: "8, 8",
            opacity: 0.9
          }).addTo(layerGroup);
        });
      }

      // Warehouse marker
      L.marker(warehouseCoordinates, { icon: WarehouseIcon })
        .bindPopup("Central Warehouse")
        .addTo(layerGroup);

      // Order markers
      routeData.orders.forEach((order) => {
        const coords = order.delivery_coordinates.split(",").map(Number);
        L.marker(coords, { icon: DeliveryIcon })
          .bindPopup(`<b>${order.name}</b><br/>Status: ${order.status}`)
          .addTo(layerGroup);
      });

      // Truck marker
      const startCoord = roadPath.length > 0 ? roadPath[0] : warehouseCoordinates;
      const truck = L.marker(startCoord, { icon: TruckIcon }).addTo(layerGroup);
      truckMarkerRef.current = truck;
      setCurrentPointIndex(0);
    }
  }, [routeData]);

  // Handle Mark as Delivered
  const handleMarkDelivered = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" })
      });
      if (response.ok) {
        // Refresh local orders list status
        setRouteData(prev => ({
          ...prev,
          orders: prev.orders.map(o => o.id === orderId ? { ...o, status: "delivered" } : o)
        }));
        addLog(`✅ Order #${orderId} marked as DELIVERED.`);
      } else {
        alert("Failed to update status on server.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting database.");
    }
  };

  // Simulates telemetry GPS driving
  const startSimulation = async () => {
    if (!routeData || !routeData.full_route || routeData.full_route.length === 0) return;
    
    setTransitActive(true);
    addLog(`🚚 Driver telemetry dispatch: Simulating GPS route transit.`);

    // Set first order status to in-transit if it's pending/in-process
    const pendingOrders = routeData.orders.filter(o => o.status !== "delivered");
    if (pendingOrders.length > 0) {
      try {
        await fetch(`${API_BASE_URL}/orders/${pendingOrders[0].id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in-transit" })
        });
        setRouteData(prev => ({
          ...prev,
          orders: prev.orders.map(o => o.id === pendingOrders[0].id ? { ...o, status: "in-transit" } : o)
        }));
      } catch (err) {
        console.error(err);
      }
    }

    const path = routeData.full_route;
    let idx = currentPointIndex;
    
    simulationIntervalRef.current = setInterval(async () => {
      if (idx >= path.length - 1) {
        stopSimulation();
        setCurrentPointIndex(path.length - 1);
        setDistanceRemaining(0);
        setEta("Arrived");
        addLog("🏁 Route complete. Returned to Central Depot.");
        return;
      }
      
      idx += 1;
      setCurrentPointIndex(idx);
      
      const currentPt = path[idx];
      if (truckMarkerRef.current) {
        truckMarkerRef.current.setLatLng([currentPt.lat, currentPt.lng]);
        
        // Auto pan map if transit active
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([currentPt.lat, currentPt.lng]);
        }
      }

      // Calculate speed variations
      const currentSpeed = Math.floor(45 + Math.random() * 20);
      setSpeed(currentSpeed);

      // Scale remaining distance
      const percentLeft = (path.length - idx) / path.length;
      const distLeft = Math.max(0, parseFloat((routeData.route_distance * percentLeft).toFixed(2)));
      setDistanceRemaining(distLeft);
      setEta(`${Math.round(distLeft * 2)} mins`);

      // Auto update order statuses as we get close
      routeData.orders.forEach(async (order) => {
        if (order.status === "in-transit") {
          const orderCoords = order.delivery_coordinates.split(",").map(Number);
          const distToOrder = Math.sqrt(
            Math.pow(currentPt.lat - orderCoords[0], 2) + 
            Math.pow(currentPt.lng - orderCoords[1], 2)
          );
          
          // Threshold to declare arrival
          if (distToOrder < 0.001) {
            addLog(`📍 Arrived at delivery location: '${order.name}'.`);
          }
        }
      });

    }, 400);
  };

  useEffect(() => {
    return () => stopSimulation();
  }, []);

  return (
    <div className="bg-gray-950 min-h-screen text-white pt-24 pb-12">
      <Navbar />
      <div className="container mx-auto px-4 max-w-md">
        
        {/* Header Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent uppercase tracking-wider flex items-center justify-center gap-2">
            <Truck size={24} className="text-orange-500" />
            Driver Console
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time Driver Telemetry & GPS Dispatch Simulator
          </p>
        </div>

        {/* Vehicle Selector Card */}
        <div className="glass-panel p-5 rounded-2xl mb-6">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
            Select Dispatch Vehicle
          </label>
          <select 
            value={selectedVehicle}
            onChange={(e) => handleVehicleSelect(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
          >
            <option value="">-- Select Vehicle --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                🚚 Vehicle #{v.id} (Capacity: {v.capacity} kg)
              </option>
            ))}
          </select>
          {error && (
            <div className="mt-3 flex items-start gap-2 text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {routeData && (
          <div className="space-y-6">
            
            {/* Live Telemetry HUD */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-panel p-3 rounded-2xl text-center flex flex-col items-center justify-center border border-gray-800/60">
                <Gauge size={16} className="text-orange-500 mb-1" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Speed</span>
                <span className="text-lg font-black text-white mt-0.5">{speed} <span className="text-[10px] font-medium text-gray-400">km/h</span></span>
              </div>
              <div className="glass-panel p-3 rounded-2xl text-center flex flex-col items-center justify-center border border-gray-800/60">
                <Clock size={16} className="text-amber-500 mb-1" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">ETA</span>
                <span className="text-lg font-black text-white mt-0.5">{eta}</span>
              </div>
              <div className="glass-panel p-3 rounded-2xl text-center flex flex-col items-center justify-center border border-gray-800/60">
                <Milestone size={16} className="text-yellow-500 mb-1" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Distance</span>
                <span className="text-lg font-black text-white mt-0.5">{distanceRemaining} <span className="text-[10px] font-medium text-gray-400">km</span></span>
              </div>
            </div>

            {/* GPS Map Panel */}
            <div className="glass-panel p-2.5 rounded-2xl relative overflow-hidden">
              <div 
                ref={mapContainerRef} 
                className="h-56 rounded-xl overflow-hidden border border-gray-800"
                style={{ width: "100%" }}
              >
              </div>

              {/* Float Simulator Button */}
              <div className="mt-3">
                {!transitActive ? (
                  <button 
                    onClick={startSimulation}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-950/20 active:scale-95"
                  >
                    <Play size={16} />
                    Start Transit GPS
                  </button>
                ) : (
                  <button 
                    onClick={stopSimulation}
                    className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-900/40 text-red-400 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <AlertTriangle size={16} />
                    Pause Transit Simulation
                  </button>
                )}
              </div>
            </div>

            {/* Step-by-Step Route Sheet */}
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Navigation size={16} className="text-orange-500" />
                Delivery Manifest Stop Sheet
              </h3>
              
              <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-800">
                {/* Depot Start Stop */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center text-green-400 shrink-0">
                    <MapPin size={12} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Central Warehouse Depot</h4>
                    <p className="text-[10px] text-gray-400">Route starting location (Mumbai)</p>
                  </div>
                </div>

                {/* Delivery orders */}
                {routeData.orders.map((order, idx) => (
                  <div key={order.id} className="flex gap-4 items-start relative z-10">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      order.status === "delivered" 
                        ? "bg-green-500/20 border border-green-500 text-green-400"
                        : order.status === "in-transit"
                        ? "bg-orange-500/20 border border-orange-500 text-orange-400 animate-pulse"
                        : "bg-gray-800 border border-gray-700 text-gray-400"
                    }`}>
                      {order.status === "delivered" ? <CheckCircle size={12} /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{order.name}</h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          order.priority === 1 ? 'bg-red-500/15 text-red-400 border border-red-950/20' : 
                          order.priority === 2 ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-950/20' : 
                          'bg-green-500/15 text-green-400 border border-green-950/20'
                        }`}>
                          Lvl {order.priority}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-400">Weight: {order.weight} kg | Distance: {order.delivery_distance} km</p>
                      
                      {/* Mark Complete Action */}
                      {order.status !== "delivered" ? (
                        <button
                          onClick={() => handleMarkDelivered(order.id)}
                          className="mt-2 text-[10px] font-bold bg-gray-900 border border-gray-800 hover:border-green-500 hover:text-green-400 text-gray-300 py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all w-full md:w-auto justify-center"
                        >
                          <CheckCircle2 size={12} />
                          Mark as Delivered
                        </button>
                      ) : (
                        <div className="mt-1 text-[10px] font-bold text-green-400 flex items-center gap-1">
                          <CheckCircle size={10} />
                          <span>Delivered</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Log Terminal */}
            <div className="glass-panel p-4 rounded-2xl">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Live Telemetry Log Feed</h4>
              <div className="bg-gray-900/60 rounded-xl p-3 h-28 overflow-y-auto font-mono text-[9px] text-orange-400 border border-gray-800/80 space-y-1">
                {logs.length === 0 ? (
                  <span className="text-gray-500 italic">No telemetry data...</span>
                ) : (
                  logs.map((log, i) => <div key={i}>{log}</div>)
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default DriverPage;
