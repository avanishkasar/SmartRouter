import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo5.png";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Orders Board", href: "/order" },
  { label: "Fleet Vehicles", href: "/vehicles" },
  { label: "Driver Console", href: "/driver" }
];

const Navbar = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  
  const token = localStorage.getItem("access_token");
  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "dispatcher";
  const isLoggedIn = !!token;

  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-3 bg-gray-950/75 backdrop-blur-md border-b border-gray-800/80">
      <div className="container px-4 mx-auto relative lg:text-sm">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/">
              <img src={logo} alt="logo" className="h-10 w-14 mr-2 object-contain" />
            </Link>
            <Link to="/">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">SmartRoute</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isLoggedIn && (
            <ul className="hidden lg:flex ml-14 space-x-8">
              {navItems.map((item, index) => (
                <li key={index}>
                  <Link to={item.href} className="hover:text-orange-400 font-medium text-gray-300 transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          )}

          {/* Desktop Session Details */}
          <div className="hidden lg:flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                {/* User Info */}
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-850 px-3.5 py-1.5 rounded-full">
                  <UserIcon size={14} className="text-orange-400" />
                  <div className="text-left leading-none">
                    <p className="text-xs font-bold text-white leading-none">{username}</p>
                    <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-wider leading-none mt-0.5 block">{role}</span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="hover:bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold py-2 px-3.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={13} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="text-gray-300 hover:text-white text-xs font-bold transition-colors self-center">
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold py-2 px-4 rounded-full transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex">
            <button onClick={toggleNavbar}>
              {mobileDrawerOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileDrawerOpen && (
          <div className="bg-gray-900 border-t border-gray-850 fixed right-0 top-14 z-20 w-full p-6 flex flex-col items-center lg:hidden">
            {isLoggedIn ? (
              <>
                <div className="flex flex-col items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-full bg-orange-950/40 border border-orange-900/40 flex items-center justify-center text-orange-400">
                    <UserIcon size={18} />
                  </div>
                  <p className="text-sm font-bold text-white">{username}</p>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{role}</span>
                </div>
                
                <ul className="text-center w-full">
                  {navItems.map((item, index) => (
                    <li key={index} className="py-3 border-b border-gray-950">
                      <Link to={item.href} onClick={toggleNavbar} className="hover:text-orange-400 block w-full">{item.label}</Link>
                    </li>
                  ))}
                  <li className="py-4">
                    <button
                      onClick={() => {
                        toggleNavbar();
                        handleLogout();
                      }}
                      className="w-full bg-red-650/20 border border-red-500/30 text-red-400 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </li>
                </ul>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full text-center">
                <Link to="/login" onClick={toggleNavbar} className="text-gray-300 hover:text-white font-bold py-2 w-full">
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={toggleNavbar}
                  className="bg-orange-500 hover:bg-orange-400 text-white font-bold py-3.5 rounded-xl w-full"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
