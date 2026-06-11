import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo5.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("access_token");

  const handleCTA = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="bg-gray-950 min-h-screen text-white flex flex-col relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 py-4 bg-gray-950/75 backdrop-blur-md border-b border-gray-900">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SmartRoute Logo" className="h-9 w-12 object-contain" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              SmartRoute
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold py-2.5 px-5 rounded-full transition-all shadow-md shadow-orange-500/10"
              >
                Go to Console
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white text-xs font-bold transition-colors">
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-gray-900 border border-gray-800 hover:border-gray-700 text-white text-xs font-bold py-2.5 px-5 rounded-full transition-all"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-6xl text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-950/40 border border-orange-900/40 rounded-full px-4 py-1.5 text-xs text-orange-400 font-semibold mb-6 animate-pulse">
            <span>🚀</span> Next-Gen AI Route Optimization & Fleet Dispatch
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] mb-6">
            Autonomous Logistics Optimization for{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Modern Fleets
            </span>
          </h1>

          <p className="text-gray-400 text-sm sm:text-base max-w-2xl leading-relaxed mb-10">
            SmartRoute solves complex delivery logistics offline. Deploy fleets, optimize routes 
            in real-time using TSP algorithms, simulate road conditions, and dispatch 
            via AI to driver devices.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16 justify-center w-full max-w-md">
            <button
              onClick={handleCTA}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-3.5 px-8 rounded-full transition-all shadow-xl shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.99] text-sm"
            >
              {isLoggedIn ? "Access Dashboard" : "Get Started Now"}
            </button>
            <a
              href="#features"
              className="bg-gray-900/80 hover:bg-gray-900 border border-gray-850 hover:border-gray-800 text-gray-300 hover:text-white font-bold py-3.5 px-8 rounded-full transition-all text-sm"
            >
              Explore Features
            </a>
          </div>

          {/* Premium UI Mockup / Features Section */}
          <div id="features" className="w-full pt-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
              Equipped with Hackathon-Grade High Impact Utilities
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm max-w-lg mx-auto mb-12">
              Every detail is engineered to provide absolute offline readiness and visual analytics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Feature 1 */}
              <div className="glass-panel p-6 rounded-2xl border border-gray-900 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-orange-950/60 border border-orange-900/30 rounded-xl flex items-center justify-center text-lg mb-4">
                    🤖
                  </div>
                  <h3 className="text-base font-bold text-orange-400 mb-2">AI Chat Dispatcher</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Input natural language commands to add orders, deploy vehicles, or clear coordinates instantly. Powered by an offline parser.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="glass-panel p-6 rounded-2xl border border-gray-900 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-blue-950/60 border border-blue-900/30 rounded-xl flex items-center justify-center text-lg mb-4">
                    ⚡
                  </div>
                  <h3 className="text-base font-bold text-blue-400 mb-2">Weather & Traffic Noise</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Inject weather hazards or traffic bottlenecks locally. The system feeds overrides into regression models for instant ETA changes.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="glass-panel p-6 rounded-2xl border border-gray-900 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-emerald-950/60 border border-emerald-900/30 rounded-xl flex items-center justify-center text-lg mb-4">
                    📊
                  </div>
                  <h3 className="text-base font-bold text-emerald-400 mb-2">Cost & CO₂ Analytics</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Analyze absolute fuel cost savings and metric tons of carbon reduction comparing TSP routes to unoptimized sequential delivery.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="glass-panel p-6 rounded-2xl border border-gray-900 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-purple-950/60 border border-purple-900/30 rounded-xl flex items-center justify-center text-lg mb-4">
                    🗺️
                  </div>
                  <h3 className="text-base font-bold text-purple-400 mb-2">CartoDB Dark Tile Maps</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Visualise routing paths instantly using Leaflet.js and OpenStreetMap overlays. Clean, responsive, and completely key-free.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="glass-panel p-6 rounded-2xl border border-gray-900 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-amber-950/60 border border-amber-900/30 rounded-xl flex items-center justify-center text-lg mb-4">
                    💬
                  </div>
                  <h3 className="text-base font-bold text-amber-400 mb-2">WhatsApp Driver Agent</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Export route instructions directly to delivery drivers. Pre-formatted route stop sequences can be dispatched with a single tap.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="glass-panel p-6 rounded-2xl border border-gray-900 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-indigo-950/60 border border-indigo-900/30 rounded-xl flex items-center justify-center text-lg mb-4">
                    🛡️
                  </div>
                  <h3 className="text-base font-bold text-indigo-400 mb-2">Secure JWT Guard</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Built-in role management (dispatcher, manager) with secure session storage to restrict dispatch parameters to authenticated personnel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-gray-950 border-t border-gray-900 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} SmartRoute. Built for FAR AWAY 2026 Hackathon.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
