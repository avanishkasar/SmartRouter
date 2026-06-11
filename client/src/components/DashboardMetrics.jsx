import { API_BASE_URL } from '../config';
import { useEffect, useState } from "react";

const MetricCard = ({ label, value, unit, colorClass, accent = false, delay = 0 }) => (
  <div
    className={`p-4 rounded-xl text-center interactive-card animate-fade-in-up ${
      accent
        ? colorClass
        : "glass-panel border border-gray-800/60"
    }`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <h2 className={`text-[10px] font-bold uppercase tracking-wide ${accent ? "" : "text-gray-400"}`}>
      {label}
    </h2>
    <p className={`text-2xl font-extrabold mt-2 animate-number-pop ${colorClass}`}>
      {value}
      {unit && <span className="text-xs font-medium ml-1 opacity-60">{unit}</span>}
    </p>
  </div>
);

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
  
  const distanceVal = isManager ? stats.total_distance : (routeData?.route_distance ?? 0);
  const fuelCost = (distanceVal * cost_perKM).toFixed(2);
  
  const distSaved = distanceVal * 0.35;
  const costSaved = (distSaved * cost_perKM).toFixed(2);
  const co2Saved = (distSaved * co2Factor).toFixed(2);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 px-1 py-2">
      <MetricCard label="Total Orders" value={stats.total_orders} colorClass="text-white" delay={0} />
      <MetricCard label="Pending Orders" value={stats.pending_orders} colorClass="text-orange-400" delay={50} />
      <MetricCard label="Total Vehicles" value={stats.total_vehicles} colorClass="text-white" delay={100} />
      <MetricCard label="Active Vehicles" value={stats.vehicles_with_in_process_orders} colorClass="text-blue-400" delay={150} />
      <MetricCard
        label={isManager ? "Total Fleet Dist" : "Route Distance"}
        value={distanceVal > 0 ? distanceVal.toFixed(1) : "N/A"}
        unit={distanceVal > 0 ? "Km" : ""}
        colorClass="text-white"
        delay={200}
      />
      <MetricCard
        label={isManager ? "Total Fuel Cost" : "Est. Fuel Cost"}
        value={`₹${distanceVal > 0 ? fuelCost : "0.00"}`}
        colorClass="text-white"
        delay={250}
      />
      <MetricCard
        label="Fuel Saved"
        value={`₹${distanceVal > 0 ? costSaved : "0.00"}`}
        colorClass="text-emerald-300"
        accent={true}
        delay={300}
      />
      <MetricCard
        label="CO₂ Saved"
        value={distanceVal > 0 ? co2Saved : "0.00"}
        unit="kg"
        colorClass="text-teal-300"
        accent={true}
        delay={350}
      />
    </div>
  );
};

export default DashboardMetrics;
