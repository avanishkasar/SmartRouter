import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo5.png";

const features = [
  {
    icon: "🤖",
    title: "AI Chat Dispatcher",
    desc: "Input natural language commands to add orders, deploy vehicles, or clear coordinates instantly. Powered by an offline parser.",
    color: "orange",
    bg: "bg-orange-950/60",
    border: "border-orange-900/30",
    text: "text-orange-400",
  },
  {
    icon: "⚡",
    title: "Weather & Traffic Noise",
    desc: "Inject weather hazards or traffic bottlenecks locally. The system feeds overrides into regression models for instant ETA changes.",
    color: "blue",
    bg: "bg-blue-950/60",
    border: "border-blue-900/30",
    text: "text-blue-400",
  },
  {
    icon: "📊",
    title: "Cost & CO₂ Analytics",
    desc: "Analyze absolute fuel cost savings and metric tons of carbon reduction comparing TSP routes to unoptimized sequential delivery.",
    color: "emerald",
    bg: "bg-emerald-950/60",
    border: "border-emerald-900/30",
    text: "text-emerald-400",
  },
  {
    icon: "🗺️",
    title: "CartoDB Dark Tile Maps",
    desc: "Visualise routing paths instantly using Leaflet.js and OpenStreetMap overlays. Clean, responsive, and completely key-free.",
    color: "purple",
    bg: "bg-purple-950/60",
    border: "border-purple-900/30",
    text: "text-purple-400",
  },
  {
    icon: "💬",
    title: "WhatsApp Driver Agent",
    desc: "Export route instructions directly to delivery drivers. Pre-formatted route stop sequences can be dispatched with a single tap.",
    color: "amber",
    bg: "bg-amber-950/60",
    border: "border-amber-900/30",
    text: "text-amber-400",
  },
  {
    icon: "🛡️",
    title: "Secure JWT Guard",
    desc: "Built-in role management (dispatcher, manager, admin) with secure session storage to restrict dispatch parameters to authenticated personnel.",
    color: "indigo",
    bg: "bg-indigo-950/60",
    border: "border-indigo-900/30",
    text: "text-indigo-400",
  },
  {
    icon: "🚄",
    title: "Gati Shakti Intermodal",
    desc: "Enable PM Gati Shakti-aligned intermodal routing, blending road and rail segments to minimize last-mile delivery costs.",
    color: "cyan",
    bg: "bg-cyan-950/60",
    border: "border-cyan-900/30",
    text: "text-cyan-400",
  },
  {
    icon: "🛡️",
    title: "AI Disruption Recovery",
    desc: "Simulate vehicle breakdowns and trigger an autonomous multi-agent recovery loop that reroutes affected orders in real-time.",
    color: "red",
    bg: "bg-red-950/60",
    border: "border-red-900/30",
    text: "text-red-400",
  },
  {
    icon: "📦",
    title: "Manual Override Console",
    desc: "Logistics managers can manually reallocate orders to vehicles or bypass TSP logic entirely, with instant rerouting sequences.",
    color: "teal",
    bg: "bg-teal-950/60",
    border: "border-teal-900/30",
    text: "text-teal-400",
  },
];

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
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] bg-orange-600/8 rounded-full blur-[130px] pointer-events-none animate-float-orb" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] bg-blue-600/8 rounded-full blur-[130px] pointer-events-none animate-float-orb" style={{ animationDelay: '6s' }} />
      <div className="absolute top-[40%] left-[50%] w-[30vw] h-[30vw] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none animate-float-orb" style={{ animationDelay: '3s' }} />

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
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 animate-badge-shimmer border border-orange-900/40 rounded-full px-4 py-1.5 text-xs text-orange-400 font-semibold mb-6 animate-fade-in-up stagger-1">
            <span>🚀</span> Next-Gen AI Route Optimization & Fleet Dispatch
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] mb-6 animate-fade-in-up stagger-2">
            Autonomous Logistics{" "}
            <br className="hidden sm:block" />
            Optimization for{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent animate-gradient-text">
              Modern Fleets
            </span>
          </h1>

          <p className="text-gray-400 text-sm sm:text-base max-w-2xl leading-relaxed mb-10 animate-fade-in-up stagger-3">
            SmartRoute solves complex delivery logistics offline. Deploy fleets, optimize routes{" "}
            in real-time using TSP algorithms, simulate road conditions, and dispatch{" "}
            via AI to driver devices.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20 justify-center w-full max-w-md animate-fade-in-up stagger-4">
            <button
              onClick={handleCTA}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-3.5 px-8 rounded-full transition-all shadow-xl shadow-orange-500/15 hover:shadow-orange-500/25 active:scale-[0.99] text-sm"
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

          {/* Stats strip */}
          <div className="flex flex-wrap justify-center gap-6 mb-20 animate-fade-in-up stagger-5">
            {[
              { label: "TSP Algorithm", value: "Nearest Neighbour" },
              { label: "ML ETA Model", value: "RandomForest" },
              { label: "Map Engine", value: "Leaflet + OSM" },
              { label: "Auth System", value: "JWT + bcrypt" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-orange-400 font-bold text-xs">{s.value}</p>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div id="features" className="w-full pt-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 animate-fade-in-up">
              Equipped with Hackathon-Grade High Impact Utilities
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm max-w-lg mx-auto mb-12 animate-fade-in-up">
              Every detail is engineered to provide absolute offline readiness and visual analytics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`feature-card glass-panel p-6 rounded-2xl border border-gray-900 flex flex-col justify-between animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
                >
                  <div>
                    <div className={`w-10 h-10 ${f.bg} border ${f.border} rounded-xl flex items-center justify-center text-lg mb-4`}>
                      {f.icon}
                    </div>
                    <h3 className={`text-base font-bold ${f.text} mb-2`}>{f.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
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
