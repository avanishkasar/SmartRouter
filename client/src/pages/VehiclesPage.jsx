import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from "react";
import VehicleInputForm from "../components/VehicleInputForm";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Trash2, Truck } from "lucide-react";

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [routesMap, setRoutesMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchVehiclesAndRoutes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicles/`);
      const vehiclesList = response.data;
      setVehicles(vehiclesList);

      // Fetch route details for each vehicle to show active stops and distances
      const routesObj = {};
      await Promise.all(
        vehiclesList.map(async (v) => {
          try {
            const rRes = await axios.get(`http://127.0.0.1:8000/route/${v.id}`);
            if (rRes.status === 200) {
              routesObj[v.id] = rRes.data;
            }
          } catch (err) {
            // No route assigned, which is normal for empty/idle vehicles
            routesObj[v.id] = null;
          }
        })
      );
      setRoutesMap(routesObj);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError("Failed to load fleet data from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm(`Are you sure you want to decommission and delete Vehicle #${vehicleId}? This will unassign any active orders.`)) {
      return;
    }

    try {
      await axios.delete(`http://127.0.0.1:8000/vehicles/${vehicleId}`);
      alert("Vehicle successfully decommissioned!");
      fetchVehiclesAndRoutes();
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      alert("Failed to delete vehicle.");
    }
  };

  useEffect(() => {
    fetchVehiclesAndRoutes();
  }, []);

  return (
    <div className="bg-gray-950 min-h-screen text-white pt-24 pb-12">
      <Navbar />
      <div className="container mx-auto px-4 max-w-[1600px]">
        
        {/* Title Block */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent flex items-center gap-3">
            <Truck className="text-orange-400 h-8 w-8" />
            Fleet Inventory Control
          </h1>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Register new delivery vehicles and review fleet deployment metrics. Idle orders will be assigned dynamically based on remaining load limits.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: Vehicles List Table (8 columns) */}
          <div className="xl:col-span-7 space-y-4">
            <div className="glass-panel p-6 rounded-2xl shadow-xl border border-gray-800/80">
              <h2 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
                <span>📋</span> Deployed Fleet Vehicles
              </h2>

              {loading && vehicles.length === 0 ? (
                <div className="py-12 text-center text-gray-500 italic text-sm">
                  Connecting to database...
                </div>
              ) : error ? (
                <div className="bg-red-950/20 border border-red-900/30 text-red-400 p-4 rounded-xl text-center text-sm">
                  {error}
                </div>
              ) : vehicles.length === 0 ? (
                <div className="bg-gray-900/40 border border-gray-850 p-12 rounded-xl text-center text-gray-500 italic text-sm">
                  No vehicles registered. Deploy your first vehicle using the form on the right panel!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-850 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">ID</th>
                        <th className="py-3 px-3">Max Load Capacity</th>
                        <th className="py-3 px-3">Active Stops</th>
                        <th className="py-3 px-3">Route Distance</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900 text-xs font-medium">
                      {vehicles.map((v) => {
                        const route = routesMap[v.id];
                        const stopsCount = route?.assigned_orders?.length || 0;
                        const distance = route?.route_distance || 0;

                        let statusBadge = "";
                        if (stopsCount > 0) {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase font-bold text-[9px]">
                              In Route ({stopsCount} orders)
                            </span>
                          );
                        } else {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 uppercase font-bold text-[9px]">
                              Idle (Empty)
                            </span>
                          );
                        }

                        return (
                          <tr key={v.id} className="hover:bg-gray-900/35 transition-colors">
                            <td className="py-4 px-2 font-mono text-gray-500 font-bold">🚚 #{v.id}</td>
                            <td className="py-4 px-3 text-white font-bold">{v.capacity} kg</td>
                            <td className="py-4 px-3 text-gray-300">
                              {stopsCount > 0 ? (
                                <span className="font-semibold text-orange-400">
                                  {route.assigned_orders.join(" ➔ ")}
                                </span>
                              ) : (
                                <span className="text-gray-500 italic">None</span>
                              )}
                            </td>
                            <td className="py-4 px-3 font-mono text-gray-400">
                              {stopsCount > 0 ? `${distance.toFixed(1)} km` : "-"}
                            </td>
                            <td className="py-4 px-3">{statusBadge}</td>
                            <td className="py-4 px-2 text-center">
                              <button
                                onClick={() => handleDelete(v.id)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                title="Decommission Vehicle"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Add Vehicle Form (5 columns) */}
          <div className="xl:col-span-5">
            <VehicleInputForm onVehicleCreated={fetchVehiclesAndRoutes} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default VehiclesPage;
