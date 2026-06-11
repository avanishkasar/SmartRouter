import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from "react";
import OrderInputForm from "../components/OrderInputForm";
import Navbar from '../components/Navbar';
import axios from "axios";
import { Trash2, ShoppingBag } from "lucide-react";

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/`);
      setOrders(response.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel and delete Order #${orderId}?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/orders/${orderId}`);
      alert("Order deleted successfully!");
      fetchOrders();
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Failed to delete order.");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="bg-gray-950 min-h-screen text-white pt-24 pb-12">
      <Navbar />
      <div className="container mx-auto px-4 max-w-[1600px]">
        
        {/* Title Block */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent flex items-center gap-3">
              <ShoppingBag className="text-orange-400 h-8 w-8" />
              Order Dispatch Board
            </h1>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Create, review, and manage customer deliveries. System recalculates vehicle routing sequences automatically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: Orders List Table (8 columns) */}
          <div className="xl:col-span-7 space-y-4">
            <div className="glass-panel p-6 rounded-2xl shadow-xl border border-gray-800/80">
              <h2 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
                <span>📋</span> Active Delivery Registry
              </h2>

              {loading && orders.length === 0 ? (
                <div className="py-12 text-center text-gray-500 italic text-sm">
                  Connecting to database...
                </div>
              ) : error ? (
                <div className="bg-red-950/20 border border-red-900/30 text-red-400 p-4 rounded-xl text-center text-sm">
                  {error}
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-gray-900/40 border border-gray-850 p-12 rounded-xl text-center text-gray-500 italic text-sm">
                  No orders found. Pin locations on the right panel to dispatch your first order!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-850 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">ID</th>
                        <th className="py-3 px-3">Client / Name</th>
                        <th className="py-3 px-3">Priority</th>
                        <th className="py-3 px-3">Weight</th>
                        <th className="py-3 px-3">Coordinates</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900 text-xs font-medium">
                      {orders.map((order) => {
                        let priorityBadge = "";
                        if (order.priority === 1) {
                          priorityBadge = (
                            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/25 uppercase font-bold text-[9px]">
                              High (L1)
                            </span>
                          );
                        } else if (order.priority === 2) {
                          priorityBadge = (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 uppercase font-bold text-[9px]">
                              Medium (L2)
                            </span>
                          );
                        } else {
                          priorityBadge = (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25 uppercase font-bold text-[9px]">
                              Low (L3)
                            </span>
                          );
                        }

                        let statusBadge = "";
                        if (order.status === "pending") {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 uppercase font-bold text-[9px]">
                              Pending
                            </span>
                          );
                        } else if (order.status === "in-process" || order.status === "in-route") {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 uppercase font-bold text-[9px] animate-pulse">
                              Assigned
                            </span>
                          );
                        } else {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase font-bold text-[9px]">
                              Delivered
                            </span>
                          );
                        }

                        return (
                          <tr key={order.id} className="hover:bg-gray-900/35 transition-colors">
                            <td className="py-4 px-2 font-mono text-gray-500 font-bold">#{order.id}</td>
                            <td className="py-4 px-3 text-white font-bold">{order.name}</td>
                            <td className="py-4 px-3">{priorityBadge}</td>
                            <td className="py-4 px-3 font-mono text-gray-300">{order.weight} kg</td>
                            <td className="py-4 px-3 font-mono text-gray-400 tracking-tight text-[11px]">
                              {order.delivery_coordinates}
                            </td>
                            <td className="py-4 px-3">{statusBadge}</td>
                            <td className="py-4 px-2 text-center">
                              <button
                                onClick={() => handleDelete(order.id)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                title="Delete Order"
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

          {/* RIGHT SIDE: Add Order Form (5 columns) */}
          <div className="xl:col-span-5">
            <OrderInputForm onOrderCreated={fetchOrders} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderPage;
