import { API_BASE_URL } from '../config';
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import L from 'leaflet';
import "leaflet/dist/leaflet.css"; // Import Leaflet CSS
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
L.Marker.prototype.options.icon = DefaultIcon;

const OrderInputForm = ({ onOrderCreated }) => {
  const [orderData, setOrderData] = useState({
    name: "",
    priority: 1,
    weight: 0,
    delivery_coordinates: "",
  });

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      // Initialize the Leaflet map
      const map = L.map(mapRef.current).setView([19.076, 72.877], 12); // Default location: Mumbai

      // Add CartoDB Dark Matter tile layer
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      // Add click event listener to the map
      map.on("click", (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setOrderData((prev) => ({
          ...prev,
          delivery_coordinates: `${lat},${lng}`,
        }));

        // Remove previous marker if exists
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        // Place new marker
        markerRef.current = L.marker([lat, lng]).addTo(map);
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting Order:", orderData);

    try {
      const response = await axios.post(`${API_BASE_URL}/orders/`, orderData);
      console.log("Order Created:", response.data);
      alert("Order successfully created!");
      // Reset form
      setOrderData({
        name: "",
        priority: 1,
        weight: 0,
        delivery_coordinates: ""
      });
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (onOrderCreated) {
        onOrderCreated();
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 glass-panel rounded-2xl shadow-xl mt-6 border border-gray-800">
      <h2 className="text-2xl font-bold mb-2 text-orange-400 flex items-center gap-2">
        <span>📦</span> Create New Order
      </h2>
      <p className="text-xs text-gray-400 mb-6 leading-relaxed">
        Input details and click on the map to pin the customer's delivery location coordinates.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Order Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Order / Client Name</label>
          <input
            type="text"
            value={orderData.name}
            onChange={(e) => setOrderData({ ...orderData, name: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            placeholder="e.g. Client Alpha"
            required
          />
        </div>

        {/* Priority & Weight (Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Priority</label>
            <select
              value={orderData.priority}
              onChange={(e) => setOrderData({ ...orderData, priority: Number(e.target.value) })}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              required
            >
              <option value={1}>High (Level 1)</option>
              <option value={2}>Moderate (Level 2)</option>
              <option value={3}>Low (Level 3)</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Weight (Kg)</label>
            <input
              type="number"
              value={orderData.weight === 0 ? "" : orderData.weight}
              onChange={(e) => setOrderData({ ...orderData, weight: Math.max(0.01, parseFloat(e.target.value) || 0) })}
              step="any"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              placeholder="e.g. 15.5"
              required
            />
          </div>
        </div>

        {/* Leaflet Map for Pinning Location */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Pin Delivery Location</label>
          <div
            ref={mapRef}
            className="w-full border border-gray-800 rounded-xl overflow-hidden shadow-inner relative z-10"
            style={{ height: '300px' }}
          ></div>
        </div>

        {/* Display Selected Coordinates */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Selected Coordinates</label>
          <input
            type="text"
            value={orderData.delivery_coordinates}
            placeholder="Click on the map above to select coordinates"
            readOnly
            className="w-full bg-gray-950/50 border border-gray-850 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed focus:outline-none"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/10 active:scale-[0.99]"
        >
          Submit & Route Order
        </button>
      </form>
    </div>
  );
};

export default OrderInputForm;
