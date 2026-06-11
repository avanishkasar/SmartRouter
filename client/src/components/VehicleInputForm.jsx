import { API_BASE_URL } from '../config';
import React, { useState } from "react";
import axios from "axios";

const VehicleInputForm = ({ onVehicleCreated }) => {
  const [vehicleData, setVehicleData] = useState({
    capacity: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cap = parseFloat(vehicleData.capacity);
    if (isNaN(cap) || cap <= 0) {
      alert("Please enter a positive capacity capacity!");
      return;
    }

    console.log("Submitting Vehicle:", vehicleData);

    try {
      const response = await axios.post(`${API_BASE_URL}/vehicles/`, {
        capacity: cap
      });
      console.log("Vehicle Added:", response.data);
      alert("Vehicle successfully added!");
      setVehicleData({ capacity: "" });
      if (onVehicleCreated) {
        onVehicleCreated();
      }
    } catch (error) {
      console.error("Error adding vehicle:", error);
      alert(error.response?.data?.detail || "Failed to add vehicle.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 glass-panel rounded-2xl shadow-xl mt-6 border border-gray-800">
      <h2 className="text-2xl font-bold mb-2 text-orange-400 flex items-center gap-2">
        <span>🚚</span> Add New Vehicle
      </h2>
      <p className="text-xs text-gray-400 mb-6 leading-relaxed">
        Deploy a new vehicle into the fleet. The routing engine will automatically assign pending orders based on capacities.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Vehicle Capacity */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Max Weight Capacity (Kg)</label>
          <input
            type="number"
            value={vehicleData.capacity}
            onChange={(e) => setVehicleData({ ...vehicleData, capacity: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            placeholder="e.g. 100"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/10 active:scale-[0.99]"
        >
          Submit Vehicle
        </button>
      </form>
    </div>
  );
};

export default VehicleInputForm;
