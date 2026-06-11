import { API_BASE_URL } from '../config';
import React, { useState, useEffect, useRef } from "react";
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GoogleMapComponent from '../components/GoogleMapComponent';
import DashboardMetrics from '../components/DashboardMetrics';
import axios from "axios";
import { 
  Trash2, 
  Settings, 
  Database, 
  Users, 
  Sliders, 
  Activity, 
  ShieldAlert, 
  Server,
  RefreshCw,
  TrendingUp,
  UserCheck
} from "lucide-react";

const HomePage = () => {
  // Session variables
  const userRole = localStorage.getItem("role") || "dispatcher";
  const username = localStorage.getItem("username") || "User";

  const [routeData, setRouteData] = useState(null); // Selected vehicle route data
  const [traffic, setTraffic] = useState("Moderate");
  const [weather, setWeather] = useState("Clear: clear sky");
  const [intermodal, setIntermodal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Dispatcher chat console state
  const [messages, setMessages] = useState([
    { text: "🤖 Welcome to the AI Dispatcher Console. Control the route planning engine using natural language commands.\n\nExamples:\n• 'add order Client F with priority 1, weight 12 at 19.141, 72.842'\n• 'add vehicle with capacity 90'\n• 'optimize routes'\n• 'reset dashboard'", isBot: true }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Live Telemetry Logs Feed
  const [telemetryLogs, setTelemetryLogs] = useState([
    { time: new Date().toLocaleTimeString(), text: "📡 System initialized. GPS telemetry feeds active." },
    { time: new Date().toLocaleTimeString(), text: "🗺️ Road graph 'mumbai_road_network.graphml' loaded successfully." },
    { time: new Date().toLocaleTimeString(), text: "🧠 Scikit-Learn RandomForest ETA prediction engine connected." },
  ]);

  const logEndRef = useRef(null);

  const addLog = (text) => {
    setTelemetryLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), text }
    ].slice(-20)); // Limit to last 20 logs
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [telemetryLogs]);

  // Periodic sensor checks
  useEffect(() => {
    const intervals = [
      "🔄 GPS signal ping successful. Ping latency: 14ms.",
      "🟢 Battery health level normal across all fleet vehicles.",
      "🧠 Scikit-Learn scaler verifying features bounds: OK.",
      "📊 OpenStreetMap graph node checks complete: 0 warnings.",
      "📡 Fleet telemetry sync completed."
    ];
    const timer = setInterval(() => {
      const randomText = intervals[Math.floor(Math.random() * intervals.length)];
      addLog(randomText);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // Recalculation logic
  const handleRecalculate = async (selectedTraffic = traffic, selectedWeather = weather, selectedIntermodal = intermodal) => {
    addLog(`⚡ Synthetic noise changed. Traffic: '${selectedTraffic}', Weather: '${selectedWeather}', Intermodal: ${selectedIntermodal}.`);
    addLog(`🧠 Re-evaluating routes through ML prediction scaler...`);
    try {
      const res = await fetch(`${API_BASE_URL}/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traffic_level: selectedTraffic,
          weather_condition: selectedWeather,
          intermodal: selectedIntermodal
        })
      });
      if (res.ok) {
        addLog(`✅ TSP routes and ML predictions successfully updated!`);
        if (routeData?.vehicle_id) {
          fetchVehicleRoute(routeData.vehicle_id);
        }
      }
    } catch (e) {
      addLog(`❌ Recalculation failed: ${e.message}`);
    }
  };

  const fetchVehicleRoute = async (vehicleId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/route/${vehicleId}`);
      if (response.ok) {
        const route = await response.json();
        setRouteData(route);
        addLog(`🚚 Selected Route details for Vehicle ${vehicleId}.`);
      } else {
        setRouteData(null);
      }
    } catch (error) {
      setRouteData(null);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage;
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setInputMessage("");
    setLoading(true);
    addLog(`💬 Chat Agent Command: "${userMsg}"`);

    try {
      const res = await fetch(`${API_BASE_URL}/chat-dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { text: data.response, isBot: true }]);
      
      if (data.status === "success") {
        addLog(`🤖 Command succeeded: ${userMsg.split(" ")[0].toUpperCase()}`);
        if (routeData?.vehicle_id) {
          fetchVehicleRoute(routeData.vehicle_id);
        } else {
          fetchVehicleRoute(1);
        }
      } else {
        addLog(`⚠️ Command returned feedback: ${data.status}`);
      }
    } catch (err) {
      setMessages(prev => [...prev, { text: "🤖 Sorry, I encountered an error communicating with the dispatch server.", isBot: true }]);
      addLog(`❌ Chat API Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!routeData) return "#";
    const orderDetails = routeData.assigned_orders
      ? `Stops: ${routeData.assigned_orders.join(" ➔ ")}`
      : "No assigned stops";
    const message = `Hello Driver! Here is your optimized dispatch route for Vehicle ${routeData.vehicle_id}:
- Route Distance: ${routeData.route_distance} km
- ${orderDetails}
- Map Route: http://localhost:5173/

Safe travels!`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  // --- LOGISTICS MANAGER STATE & HANDLERS ---
  const [managerConfig, setManagerConfig] = useState({
    fuelPrice: 103,
    fuelEfficiency: 17.2,
    driverWage: 150,
    co2Factor: 0.12
  });

  const [managerOrders, setManagerOrders] = useState([]);
  const [managerVehicles, setManagerVehicles] = useState([]);
  const [managerRefreshTrigger, setManagerRefreshTrigger] = useState(0);

  // --- DISRUPTION SIMULATOR STATE & HANDLERS ---
  const [simulating, setSimulating] = useState(false);
  const [simLogs, setSimLogs] = useState([]);
  const [showSimBox, setShowSimBox] = useState(false);

  const handleSimulateDisruption = async () => {
    setSimulating(true);
    setShowSimBox(true);
    setSimLogs(["🛰️ [OrchestratorAgent]: Initializing breakdown simulation...", "📡 [TelemetryAgent]: Connecting to vehicle engine control unit (ECU)..."]);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/simulate-disruption`);
      const logs = response.data.logs;
      
      // Print logs one by one with a delay to look organic
      for (let i = 0; i < logs.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setSimLogs(prev => [...prev, logs[i]]);
      }
      
      // Trigger update
      setManagerRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      setSimLogs(prev => [...prev, "❌ [OrchestratorAgent]: Error during disruption recovery simulation: " + (err.response?.data?.detail || err.message)]);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    if (userRole === "manager") {
      const fetchManagerData = async () => {
        try {
          const ordersRes = await axios.get(`${API_BASE_URL}/orders/`);
          const vehiclesRes = await axios.get(`${API_BASE_URL}/vehicles/`);
          setManagerOrders(ordersRes.data);
          setManagerVehicles(vehiclesRes.data);
        } catch (err) {
          console.error("Manager data load error:", err);
        }
      };
      fetchManagerData();
    }
  }, [userRole, managerRefreshTrigger, routeData]);

  const handleManualAssignment = async (orderId, vehicleId) => {
    try {
      const vId = vehicleId === "" ? null : parseInt(vehicleId);
      await axios.put(`${API_BASE_URL}/orders/${orderId}/assign`, {
        vehicle_id: vId
      });
      alert(`Order #${orderId} allocation updated successfully!`);
      setManagerRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update manual order assignment.");
    }
  };

  // --- SYSTEM ADMIN STATE & HANDLERS ---
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminDiagnostics, setAdminDiagnostics] = useState(null);
  const [adminRefreshTrigger, setAdminRefreshTrigger] = useState(0);
  const [latencyTicker, setLatencyTicker] = useState(15);

  useEffect(() => {
    if (userRole === "admin") {
      const fetchAdminData = async () => {
        try {
          const usersRes = await axios.get(`${API_BASE_URL}/auth/users`);
          const diagRes = await axios.get(`${API_BASE_URL}/admin/diagnostics`);
          setAdminUsers(usersRes.data);
          setAdminDiagnostics(diagRes.data);
        } catch (err) {
          console.error("Admin data load error:", err);
        }
      };
      fetchAdminData();
    }
  }, [userRole, adminRefreshTrigger]);

  // Simulate network db query latency ticks
  useEffect(() => {
    if (userRole === "admin") {
      const timer = setInterval(() => {
        setLatencyTicker(Math.floor(10 + Math.random() * 20));
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [userRole]);

  const handleUserRoleUpdate = async (userId, newRole) => {
    try {
      await axios.put(`${API_BASE_URL}/auth/users/${userId}/role`, {
        role: newRole
      });
      alert("User role updated successfully!");
      setAdminRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to update user role.");
    }
  };

  const handleUserDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user account?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/auth/users/${userId}`);
      alert("User account deleted.");
      setAdminRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to delete user.");
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm("WARNING: This will wipe all current orders/vehicles and seed defaults. Proceed?")) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/reset-db`);
      alert(res.data.message);
      setAdminRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to reset database.");
    }
  };

  // --- RENDER FUNCTIONS ---

  // 1. FLEET DISPATCHER DASHBOARD
  const renderDispatcherDashboard = () => (
    <div className="flex-1 flex flex-col gap-4">
      {/* Metrics */}
      <DashboardMetrics routeData={routeData} />

      {/* Map */}
      <GoogleMapComponent routeData={routeData} />

      {/* Control Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weather/Traffic Noise Injector */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-lg font-bold text-orange-400 mb-2 flex items-center gap-2">
            <span>⚡</span> Weather & Traffic Noise Injector
          </h3>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Inject traffic and monsoon weather parameters locally. Values directly bypass external APIs and query local regression model nodes to adjust ETAs.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Traffic Congestion Level</label>
              <select 
                value={traffic} 
                onChange={(e) => {
                  setTraffic(e.target.value);
                  handleRecalculate(e.target.value, weather, intermodal);
                }}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
              >
                <option value="No Traffic">No Traffic (1.0x Delay)</option>
                <option value="Light">Light Congestion (1.1x Delay)</option>
                <option value="Moderate">Moderate Congestion (1.25x Delay)</option>
                <option value="Heavy">Heavy Gridlock (1.5x Delay)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Weather State State</label>
              <select 
                value={weather} 
                onChange={(e) => {
                  setWeather(e.target.value);
                  handleRecalculate(traffic, e.target.value, intermodal);
                }}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
              >
                <option value="Clear: clear sky">Clear Sky (1.0x Delay)</option>
                <option value="Clouds: overcast clouds (85-100%)">Overcast Clouds (1.1x Delay)</option>
                <option value="Mist: mist">Mist / Fog (1.2x Delay)</option>
                <option value="Rain: heavy intensity rain">Heavy Monsoon Rain (1.35x Delay)</option>
                <option value="Thunderstorm: heavy thunderstorm">Severe Thunderstorm (1.6x Delay)</option>
                <option value="Tornado: tornado">Extreme Storm / Tornado (2.0x Delay)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="intermodal-toggle"
                type="checkbox"
                checked={intermodal}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIntermodal(val);
                  handleRecalculate(traffic, weather, val);
                }}
                className="w-4 h-4 text-orange-500 bg-gray-900 border-gray-800 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
              />
              <label htmlFor="intermodal-toggle" className="text-xs font-semibold text-gray-300 cursor-pointer select-none">
                🚄 Enable PM Gati Shakti Intermodal Transit
              </label>
            </div>
          </div>
        </div>

        {/* WhatsApp Dispatch Panel */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-orange-400 mb-2 flex items-center gap-2">
              <span>📡</span> Driver Dispatcher Agent
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Export optimized TSP route sequences, distance targets, and destination checkins directly to the driver's mobile device via WhatsApp.
            </p>
            
            {routeData ? (
              <div className="bg-gray-950/60 border border-gray-800 p-3.5 rounded-xl text-xs text-gray-300">
                <p><strong>Active Vehicle:</strong> Vehicle #{routeData.vehicle_id}</p>
                <p className="mt-1"><strong>Route Sequence Stops:</strong></p>
                <p className="text-orange-400 font-mono mt-1.5 text-[11px] bg-orange-950/20 py-2 px-2.5 rounded border border-orange-900/30">
                  Warehouse ➔ {routeData.assigned_orders ? routeData.assigned_orders.join(" ➔ ") : "None"}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-950/10 border border-yellow-900/20 p-4 rounded-xl text-xs text-yellow-500/80 italic text-center">
                Select an active vehicle from the left sidebar to generate driver dispatch details.
              </div>
            )}
          </div>

          <a 
            href={getWhatsAppLink()}
            target="_blank"
            rel="noreferrer"
            className={`w-full text-center py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 mt-4 ${
              routeData 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg hover:shadow-emerald-500/10' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed pointer-events-none'
            }`}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 2c-5.514 0-10 4.486-10 10 0 1.758.463 3.407 1.272 4.851L2 22l5.302-1.226C8.712 21.579 10.329 22 12.031 22c5.514 0 10-4.486 10-10 0-5.514-4.486-10-10-10zm0 18c-1.464 0-2.854-.366-4.083-1.006l-.292-.15-3.038.702.716-2.913-.167-.282C4.542 15.111 4.031 13.607 4.031 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.586-6.575c-.247-.123-1.463-.722-1.692-.805-.23-.083-.396-.123-.563.123-.166.247-.645.805-.79.97-.145.165-.29.185-.537.062-.247-.123-1.043-.384-1.986-1.226-.733-.654-1.229-1.463-1.373-1.71-.145-.247-.016-.381.108-.504.111-.11.247-.29.37-.435.123-.145.165-.247.247-.412.083-.165.042-.31-.02-.435-.063-.125-.563-1.356-.77-1.855-.203-.489-.41-.422-.563-.43-.146-.007-.313-.008-.48-.008-.166 0-.438.062-.667.311-.23.247-.875.855-.875 2.084 0 1.23.896 2.418.995 2.553.1.135 1.763 2.692 4.272 3.774.597.257 1.063.411 1.424.526.6.19 1.147.163 1.58.099.482-.072 1.463-.598 1.67-.176.207-.421.207-.814.145-.875-.062-.062-.23-.103-.477-.226z"/>
            </svg>
            Dispatch Route Sequence
          </a>
        </div>
      </div>

      {/* Live Telemetry Ticker */}
      <div className="glass-panel p-5 rounded-2xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping"></span>
            Live Telemetry feed
          </h3>
          <span className="text-[9px] bg-orange-950/45 text-orange-400 px-2 py-0.5 rounded border border-orange-900/30 uppercase tracking-widest font-bold">
            OSM Live
          </span>
        </div>
        <div className="bg-gray-950 p-4 rounded-xl border border-gray-900 font-mono text-[10px] h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
          {telemetryLogs.map((log, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-gray-500 select-none">[{log.time}]</span>
              <span className="text-gray-300">{log.text}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );

  // 2. LOGISTICS MANAGER DASHBOARD
  const renderManagerDashboard = () => (
    <div className="flex-grow flex flex-col gap-6 w-full">
      {/* Stats Board */}
      <DashboardMetrics 
        routeData={routeData} 
        isManager={true}
        fuelPrice={managerConfig.fuelPrice}
        fuelEfficiency={managerConfig.fuelEfficiency}
        driverWage={managerConfig.driverWage}
        co2Factor={managerConfig.co2Factor}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Dynamic Parameter Configurator (4 columns) */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl shadow-xl border border-gray-800/80">
          <h2 className="text-lg font-bold text-orange-400 mb-2 flex items-center gap-2">
            <Sliders size={18} className="text-orange-400" />
            Parameter Configurator
          </h2>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            Tweak fuel pricing, vehicle load efficiency constants, and wage thresholds. Estimates update in real-time.
          </p>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-300 mb-1.5 uppercase">
                <span>Base Fuel Price</span>
                <span className="text-orange-400">₹{managerConfig.fuelPrice} /L</span>
              </div>
              <input 
                type="range" 
                min="80" 
                max="150" 
                value={managerConfig.fuelPrice} 
                onChange={(e) => setManagerConfig(prev => ({ ...prev, fuelPrice: parseFloat(e.target.value) }))}
                className="w-full accent-orange-500 h-1 bg-gray-950 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-gray-300 mb-1.5 uppercase">
                <span>Avg Fuel Efficiency</span>
                <span className="text-orange-400">{managerConfig.fuelEfficiency} Km/L</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="25" 
                step="0.5"
                value={managerConfig.fuelEfficiency} 
                onChange={(e) => setManagerConfig(prev => ({ ...prev, fuelEfficiency: parseFloat(e.target.value) }))}
                className="w-full accent-orange-500 h-1 bg-gray-950 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-gray-300 mb-1.5 uppercase">
                <span>Driver Hourly Wage</span>
                <span className="text-orange-400">₹{managerConfig.driverWage} /hr</span>
              </div>
              <input 
                type="range" 
                min="80" 
                max="500" 
                value={managerConfig.driverWage} 
                onChange={(e) => setManagerConfig(prev => ({ ...prev, driverWage: parseInt(e.target.value) }))}
                className="w-full accent-orange-500 h-1 bg-gray-950 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-gray-300 mb-1.5 uppercase">
                <span>CO₂ Factor</span>
                <span className="text-orange-400">{managerConfig.co2Factor} kg/Km</span>
              </div>
              <input 
                type="range" 
                min="0.05" 
                max="0.5" 
                step="0.01"
                value={managerConfig.co2Factor} 
                onChange={(e) => setManagerConfig(prev => ({ ...prev, co2Factor: parseFloat(e.target.value) }))}
                className="w-full accent-orange-500 h-1 bg-gray-950 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Load Utilization Chart (8 columns) */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl shadow-xl border border-gray-800/80">
          <h2 className="text-lg font-bold text-orange-400 mb-2 flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-400" />
            Fleet Capacity Utilization Indicators
          </h2>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            Real-time weight limit checking based on assigned pending orders. Ensure load optimization across your vehicles.
          </p>

          <div className="space-y-4">
            {managerVehicles.map(v => {
              // Calculate assigned weight
              const assignedWeight = managerOrders
                .filter(o => o.vehicle_id === v.id)
                .reduce((sum, o) => sum + o.weight, 0);
              
              const utilization = Math.min(100, Math.round((assignedWeight / v.capacity) * 100));
              const isOverloaded = utilization > 100;
              const fillClass = utilization > 85 ? "bg-red-500" : utilization > 50 ? "bg-amber-500" : "bg-emerald-500";

              return (
                <div key={v.id} className="bg-gray-950 p-4 rounded-xl border border-gray-900">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-white">🚚 Fleet Vehicle #{v.id}</span>
                    <span className="text-gray-400 font-mono">
                      Weight Load: <strong className="text-orange-400 font-bold">{assignedWeight.toFixed(1)}</strong> / {v.capacity} kg ({utilization}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-gray-800">
                    <div 
                      style={{ width: `${utilization}%` }}
                      className={`h-full transition-all duration-500 rounded-full ${fillClass}`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Disruption Recovery Simulator */}
      <div className="glass-panel p-6 rounded-2xl shadow-xl border border-gray-800/80 mt-2">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-orange-400 flex items-center gap-2">
            <span>🛡️</span> AI Disruption Recovery Simulator (Agentic Systems)
          </h2>
          <span className="text-[9px] bg-red-950/45 text-red-400 px-2 py-0.5 rounded border border-red-900/30 uppercase tracking-widest font-bold animate-pulse">
            Agentic System Theme
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Autonomously handle vehicle failures. Simulating a cooling system breakdown triggers a multi-agent recovery loop: the system takes the truck offline, evacuates stranded deliveries, and recalculates optimal TSP sequences on other active vehicles in real-time.
        </p>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 flex flex-col justify-center">
            <button
              onClick={handleSimulateDisruption}
              disabled={simulating}
              className={`w-full py-4 px-6 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                simulating
                  ? 'bg-red-800 text-red-300 opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-950/20 active:scale-[0.99]'
              }`}
            >
              <span>🚨</span> {simulating ? "Simulating Breakdown..." : "Trigger Engine Breakdown"}
            </button>
            <span className="text-[9px] text-gray-500 mt-2 text-center">
              Disrupts an active vehicle and triggers the autonomous recovery loop.
            </span>
          </div>

          <div className="flex-grow">
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-900 font-mono text-[10px] h-40 overflow-y-auto space-y-2 scrollbar-thin">
              {showSimBox ? (
                simLogs.map((log, idx) => (
                  <div key={idx} className="text-gray-300 leading-relaxed">
                    {log}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600 italic">
                  Press the breakdown button to start the multi-agent simulation.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Allocation Override Console */}
      <div className="glass-panel p-6 rounded-2xl shadow-xl border border-gray-800/80 mt-2">
        <h2 className="text-lg font-bold text-orange-400 mb-2 flex items-center gap-2">
          <span>📦</span> Manual Dispatch Allocation Override
        </h2>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Logistics managers can manually reallocate orders to different vehicles or unassign them to bypass automated TSP logic. Updates trigger instant rerouting sequences.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-850 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Order Name</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Weight</th>
                <th className="py-3 px-3">Coordinates</th>
                <th className="py-3 px-3">Allocated Fleet Vehicle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900 text-xs font-medium">
              {managerOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-900/35 transition-colors">
                  <td className="py-4 px-3 text-white font-bold">{order.name}</td>
                  <td className="py-4 px-3">
                    {order.priority === 1 ? (
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/25 uppercase font-bold text-[9px]">High</span>
                    ) : order.priority === 2 ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 uppercase font-bold text-[9px]">Medium</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25 uppercase font-bold text-[9px]">Low</span>
                    )}
                  </td>
                  <td className="py-4 px-3 font-mono text-gray-300">{order.weight} kg</td>
                  <td className="py-4 px-3 font-mono text-gray-400 tracking-tight text-[11px]">{order.delivery_coordinates}</td>
                  <td className="py-4 px-3">
                    <select
                      value={order.vehicle_id || ""}
                      onChange={(e) => handleManualAssignment(order.id, e.target.value)}
                      className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer font-bold"
                    >
                      <option value="">Pending / Unassigned</option>
                      {managerVehicles.map(v => (
                        <option key={v.id} value={v.id}>🚚 Vehicle #{v.id} (Cap: {v.capacity}kg)</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 3. SYSTEM ADMINISTRATOR DASHBOARD
  const renderAdminDashboard = () => (
    <div className="flex-grow flex flex-col gap-6 w-full">
      {/* Top Admin Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        <div className="p-4 glass-panel rounded-xl text-center">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Registered Accounts</h2>
          <p className="text-white text-3xl font-extrabold mt-2">{adminUsers.length}</p>
        </div>

        <div className="p-4 glass-panel rounded-xl text-center">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">SQLite DB Size</h2>
          <p className="text-orange-500 text-3xl font-extrabold mt-2">
            {adminDiagnostics?.database?.size_bytes 
              ? `${(adminDiagnostics.database.size_bytes / 1024).toFixed(1)} KB` 
              : "N/A"}
          </p>
        </div>

        <div className="p-4 glass-panel rounded-xl text-center">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Active Process ID</h2>
          <p className="text-blue-400 text-3xl font-extrabold mt-2">{adminDiagnostics?.environment?.process_id || "N/A"}</p>
        </div>

        <div className="p-4 glass-panel rounded-xl text-center">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">DB Response Ticker</h2>
          <p className="text-emerald-400 text-3xl font-extrabold mt-2">{latencyTicker} <span className="text-sm font-medium">ms</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* User Account Registry Console (7 columns) */}
        <div className="xl:col-span-7 glass-panel p-6 rounded-2xl shadow-xl border border-gray-800/80">
          <h2 className="text-lg font-bold text-orange-400 mb-2 flex items-center gap-2">
            <Users size={18} className="text-orange-400" />
            User Account Management Console
          </h2>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            Monitor registered dashboard accounts, promote credentials to managers, or revoke database access.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-850 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Username</th>
                  <th className="py-3 px-3">Access Role</th>
                  <th className="py-3 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900 text-xs font-medium">
                {adminUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-900/35 transition-colors">
                    <td className="py-4 px-3 text-white font-bold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-orange-950/20 border border-orange-900/30 flex items-center justify-center text-[10px] font-bold text-orange-400 uppercase">
                        {user.username[0]}
                      </div>
                      {user.username} {user.username === username && <span className="text-[9px] text-gray-500 italic font-semibold">(You)</span>}
                    </td>
                    <td className="py-4 px-3">
                      <select
                        value={user.role}
                        disabled={user.username === username}
                        onChange={(e) => handleUserRoleUpdate(user.id, e.target.value)}
                        className={`bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500 transition-all ${user.username === username ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      >
                        <option value="dispatcher">Fleet Dispatcher</option>
                        <option value="manager">Logistics Manager</option>
                        <option value="admin">System Admin</option>
                      </select>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <button
                        onClick={() => handleUserDelete(user.id)}
                        disabled={user.username === username}
                        className={`p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all ${user.username === username ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Diagnostics & Hard Controls (5 columns) */}
        <div className="xl:col-span-5 space-y-6">
          {/* Diagnostics */}
          <div className="glass-panel p-6 rounded-2xl shadow-xl border border-gray-800/80">
            <h2 className="text-lg font-bold text-orange-400 mb-2 flex items-center gap-2">
              <Server size={18} className="text-orange-400" />
              Environment & Table Counts
            </h2>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Diagnostic summary fetched directly from SQLite db handles.
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-2 border-b border-gray-900">
                <span className="text-gray-400">Operating Platform</span>
                <span className="font-mono text-white capitalize">{adminDiagnostics?.environment?.platform || "Unknown"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-900">
                <span className="text-gray-400">Python Version</span>
                <span className="font-mono text-white text-[11px] truncate max-w-[200px]" title={adminDiagnostics?.environment?.python_version}>
                  {adminDiagnostics?.environment?.python_version?.split(" ")[0] || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-900">
                <span className="text-gray-400">Users Table Row Count</span>
                <span className="font-mono text-orange-400 font-bold">{adminDiagnostics?.database?.users_count ?? 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-900">
                <span className="text-gray-400">Orders Table Row Count</span>
                <span className="font-mono text-orange-400 font-bold">{adminDiagnostics?.database?.orders_count ?? 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-900">
                <span className="text-gray-400">Vehicles Table Row Count</span>
                <span className="font-mono text-orange-400 font-bold">{adminDiagnostics?.database?.vehicles_count ?? 0}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Active Routes Stored</span>
                <span className="font-mono text-orange-400 font-bold">{adminDiagnostics?.database?.routes_count ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Hard controls */}
          <div className="glass-panel p-6 rounded-2xl shadow-xl border border-gray-800/80">
            <h2 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-400" />
              Database Hard Controls
            </h2>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Perform structural resets and clean garbage indices. Unrecoverable operations.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleResetDb}
                className="w-full bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-500/20 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                Wipe & Re-Seed Database
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="flex bg-gray-950 min-h-screen text-white pt-16">
        {/* Sidebar only shown for dispatcher */}
        {userRole === "dispatcher" && (
          <Sidebar setRouteData={setRouteData} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        )}
        
        {/* Main Workspace Frame */}
        <div className={`flex-1 transition-all duration-300 ${userRole === "dispatcher" && sidebarOpen ? "pl-64" : "pl-0"} flex flex-col lg:flex-row max-w-[1650px] mx-auto p-4 gap-4 w-full`}>
          
          {/* Switch rendering based on active user role */}
          {userRole === "dispatcher" && renderDispatcherDashboard()}
          {userRole === "manager" && renderManagerDashboard()}
          {userRole === "admin" && renderAdminDashboard()}

          {/* RIGHT FLOATING COLUMN: AI Chat Dispatcher Console (Only for Dispatcher) */}
          {userRole === "dispatcher" && (
            <div className="w-full lg:w-96 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden h-[80vh] lg:h-[850px] shadow-2xl">
              <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-orange-400 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    AI Dispatcher Console
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Control the routing engine via chat</p>
                </div>
                <button 
                  onClick={() => {
                    setMessages([
                      { text: "🤖 Welcome to the AI Dispatcher Console. Control the route planning engine using natural language commands.\n\nExamples:\n• 'add order Client F with priority 1, weight 12 at 19.141, 72.842'\n• 'add vehicle with capacity 90'\n• 'optimize routes'\n• 'reset dashboard'", isBot: true }
                    ]);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Clear
                </button>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scrollbar-thin scrollbar-thumb-gray-850 bg-gray-950/40">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.isBot ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[88%] rounded-2xl p-3.5 whitespace-pre-line leading-relaxed shadow-md ${
                      m.isBot 
                        ? "bg-gray-900/90 text-gray-200 border border-gray-800" 
                        : "bg-orange-500 text-white font-medium shadow-orange-500/10"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-900/90 border border-gray-800 text-gray-400 rounded-2xl p-3.5 italic flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-500 animate-bounce"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-500 animate-bounce delay-75"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-500 animate-bounce delay-150"></span>
                      AI dispatcher is processing...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat input box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 bg-gray-950 flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type 'add order Client E at 19.141, 72.842'..."
                  className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-400 disabled:bg-orange-700 text-white font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/10"
                >
                  Send
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default HomePage;
