// src/components/Header.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Header({ user, isAuthenticated, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <header className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and Store Name */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">🏪</span>
            </div>
            <span className="text-xl font-bold hidden sm:inline font-urdu">میرا اسٹور</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-urdu">
                  لاگ ان
                </Link>
                <Link to="/register" className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-urdu">
                  رجسٹر
                </Link>
                <Link 
                  to="/voice-login" 
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-urdu flex items-center gap-2"
                >
                  <span>🎤</span> وائس لاگ ان
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link 
                  to="/voice-samples-form" 
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm flex items-center gap-2 font-urdu"
                >
                  <span>🎙️</span> وائس رجسٹر
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    {user?.username?.charAt(0).toUpperCase() || "👤"}
                  </div>
                  <span className="text-sm font-medium font-urdu">{user?.username || "صارف"}</span>
                  <span className="text-gray-300">|</span>
                  <button 
                    onClick={handleLogout} 
                    className="text-sm hover:text-purple-200 transition-colors font-urdu flex items-center gap-1"
                  >
                    <span>🚪</span> لاگ آؤٹ
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden p-2 rounded-lg hover:bg-white/20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/20 space-y-2">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block px-3 py-2 rounded-lg hover:bg-white/20 font-urdu"
                >
                  لاگ ان
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block px-3 py-2 rounded-lg hover:bg-white/20 font-urdu"
                >
                  رجسٹر
                </Link>
                <Link 
                  to="/voice-login" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block px-3 py-2 rounded-lg hover:bg-white/20 font-urdu flex items-center gap-2"
                >
                  <span>🎤</span> وائس لاگ ان
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block px-3 py-2 rounded-lg hover:bg-white/20 font-urdu"
                >
                  👤 پروفائل
                </Link>
                <Link 
                  to="/voice-samples-form" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block px-3 py-2 rounded-lg hover:bg-white/20 font-urdu flex items-center gap-2"
                >
                  <span>🎙️</span> وائس رجسٹر
                </Link>
                <button 
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} 
                  className="w-full text-right px-3 py-2 rounded-lg hover:bg-white/20 font-urdu flex items-center gap-2"
                >
                  <span>🚪</span> لاگ آؤٹ
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;