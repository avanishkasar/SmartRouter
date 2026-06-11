import { API_BASE_URL } from '../config';
import { useEffect, useState } from "react";

const DashboardMetrics = ({ 
  routeData, 
  isManager = false,
  fuelPrice = 103, 
  fuelEfficiency = 17.2, 
  driverWage = 150, 
  co2Factor = 0.12 
}) => {
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    total_vehicles: 0,
    vehicles_with_in_process_orders: 0,
    total_distance: 0,
    total_weight: 0,
    assigned_weight: 0,
    total_capacity: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard-stats`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };
    fetchStats();
  }, [routeData]);

  const cost_perKM = fuelPrice / fuelEfficiency;
  
  // Choose between selected route metrics (dispatcher) and aggregated fleet metrics (manager)
  const distanceVal = isManager ? stats.total_distance : (routeData?.route_distance ?? 0);
  const fuelCost = (distanceVal * cost_perKM).toFixed(2);
  
  // Calculate Savings compared to unoptimized routing (35% worse path)
  const distSaved = distanceVal * 0.35;
  const costSaved = (distSaved * cost_perKM).toFixed(2);
  const co2Saved = (distSaved * co2Factor).toFixed(2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 p-4">
      <div className="p-4 glass-panel glass-panel-hover rounded-xl text-center">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Orders</h2>
        <p className="text-white text-3xl font-extrabold mt-2">{stats.total_orders}</p>
      </div>

      <div className="p-4 glass-panel glass-panel-hover rounded-xl text-center">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pending Orders</h2>
        <p className="text-orange-500 text-3xl font-extrabold mt-2">{stats.pending_orders}</p>
      </div>

      <div className="p-4 glass-panel glass-panel-hover rounded-xl text-center">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Vehicles</h2>
        <p className="text-white text-3xl font-extrabold mt-2">{stats.total_vehicles}</p>
      </div>

      <div className="p-4 glass-panel glass-panel-hover rounded-xl text-center">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Active Vehicles</h2>
        <p className="text-blue-400 text-3xl font-extrabold mt-2">{stats.vehicles_with_in_process_orders}</p>
      </div>

      <div className="p-4 glass-panel glass-panel-hover rounded-xl text-center">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          {isManager ? "Total Fleet Dist" : "Route Distance"}
        </h2>
        <p className="text-white text-3xl font-extrabold mt-2">
          {distanceVal > 0 ? `${distanceVal.toFixed(1)}` : "N/A"} <span className="text-sm font-medium text-gray-500">Km</span>
        </p>
      </div>

      <div className="p-4 glass-panel glass-panel-hover rounded-xl text-center">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          {isManager ? "Total Fuel Cost" : "Est. Fuel Cost"}
        </h2>
        <p className="text-white text-3xl font-extrabold mt-2">₹{distanceVal > 0 ? fuelCost : "0.00"}</p>
      </div>

      <div className="p-4 bg-emerald-950/30 backdrop-blur-md rounded-xl text-center border border-emerald-800/40 glow-emerald transition-all duration-300 hover:scale-[1.03]">
        <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Fuel Saved</h2>
        <p className="text-emerald-300 text-3xl font-extrabold mt-2">₹{distanceVal > 0 ? costSaved : "0.00"}</p>
      </div>

      <div className="p-4 bg-teal-950/30 backdrop-blur-md rounded-xl text-center border border-teal-800/40 glow-emerald transition-all duration-300 hover:scale-[1.03]">
        <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wide">CO₂ Saved</h2>
        <p className="text-teal-300 text-3xl font-extrabold mt-2">
          {distanceVal > 0 ? co2Saved : "0.00"} <span className="text-sm font-medium">kg</span>
        </p>
      </div>
    </div>
  );
};

export default DashboardMetrics;
