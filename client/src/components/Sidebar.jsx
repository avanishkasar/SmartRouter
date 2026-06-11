import { API_BASE_URL } from '../config';
import { ChevronsLeft, ChevronsRight, Truck } from "lucide-react";
import React, { useState, useEffect } from "react";

const Sidebar = ({ setRouteData, isOpen, setIsOpen }) => {
  const [vehicles, setVehicles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/vehicles/`);
        if (response.ok) {
          const data = await response.json();
          setVehicles(data);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };
    fetchVehicles();
  }, [setRouteData]);

  const fetchVehicleRoute = async (vehicleId) => {
    setActiveId(vehicleId);
    try {
      const response = await fetch(`${API_BASE_URL}/route/${vehicleId}`);
      if (response.ok) {
        const route = await response.json();
        setRouteData(route);
      } else {
        setRouteData(null);
      }
    } catch (error) {
      setRouteData(null);
    }
  };

  return (
    <>
      {/* Sidebar Drawer */}
      <div
        className={`h-screen bg-gray-900/90 backdrop-blur-md text-white fixed top-16 left-0 z-40 transition-all duration-300 border-r border-gray-800/80 ${
          isOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        {isOpen && (
          <div className="py-4 animate-fade-in">
            <div className="px-6 pb-3 border-b border-gray-800/60">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Fleet Vehicles</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Select to view route</p>
            </div>
            <ul className="mt-4 space-y-1.5 px-3">
              {vehicles.map((vehicle, idx) => {
                const isActive = activeId === vehicle.id;
                return (
                  <li key={vehicle.id} className={`animate-slide-in-left stagger-${Math.min(idx + 1, 6)}`}>
                    <button
                      onClick={() => fetchVehicleRoute(vehicle.id)}
                      className={`vehicle-item flex items-center p-3 rounded-xl w-full text-left transition-all border text-sm font-medium cursor-pointer ${
                        isActive
                          ? "bg-orange-950/30 text-orange-400 border-orange-900/40 shadow-inner"
                          : "hover:bg-orange-950/20 hover:text-orange-400 border-transparent hover:border-orange-900/30 text-gray-300"
                      } ${isActive ? "active" : ""}`}
                    >
                      <div className={`mr-3 p-1.5 rounded-lg ${isActive ? "bg-orange-500/20" : "bg-gray-800"} transition-all`}>
                        <Truck size={15} className={isActive ? "text-orange-400" : "text-gray-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs">Vehicle {vehicle.id}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Cap: {vehicle.capacity} kg</p>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {vehicles.length === 0 && (
              <div className="px-6 mt-8 text-center">
                <p className="text-xs text-gray-600 italic">No fleet vehicles deployed.</p>
                <p className="text-[10px] text-gray-700 mt-1">Use AI Chat to add vehicles.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3.5 left-3.5 z-50 bg-gray-900/90 border border-gray-800 text-white p-2.5 rounded-xl shadow-md hover:border-orange-500/50 hover:text-orange-400 transition-all"
      >
        {isOpen ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
      </button>
    </>
  );
};

export default Sidebar;
