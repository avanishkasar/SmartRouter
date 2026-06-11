import { API_BASE_URL } from '../config';
import { ChevronsLeft, ChevronsRight, Truck } from "lucide-react";
import React, { useState, useEffect } from "react";

const Sidebar = ({ setRouteData, isOpen, setIsOpen }) => {
  const [vehicles, setVehicles] = useState([]);
  
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
    try {
      const response = await fetch(`http://127.0.0.1:8000/route/${vehicleId}`);
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
          <div className="py-4">
            <div className="px-6 pb-3 border-b border-gray-800/60">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Fleet Vehicles</h3>
            </div>
            <ul className="mt-4 space-y-2 px-3">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id}>
                  <button
                    onClick={() => fetchVehicleRoute(vehicle.id)}
                    className="flex items-center p-3 hover:bg-orange-950/20 hover:text-orange-400 rounded-xl w-full text-left transition-all border border-transparent hover:border-orange-900/30 text-sm font-medium"
                  >
                    <Truck size={18} className="mr-3 text-orange-500" />
                    Vehicle {vehicle.id}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3.5 left-3.5 z-50 bg-gray-900/90 border border-gray-800 text-white p-2.5 rounded-xl shadow-md hover:border-orange-500/50 transition-all"
      >
        {isOpen ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
      </button>
    </>
  );
};

export default Sidebar;
