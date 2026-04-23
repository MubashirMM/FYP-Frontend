// src/components/Header.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

function Header({ user, isAuthenticated, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch user data when authenticated
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token && isAuthenticated) {
        try {
          const API = import.meta.env.VITE_API_URL;
          const res = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserData(res.data);
        } catch (err) {
          console.error("Failed to fetch user:", err);
        }
      }
    };
    
    fetchUser();
  }, [isAuthenticated]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setLogoutConfirm("");
    setLogoutError("");
  };

  const handleLogoutConfirm = () => {
    if (logoutConfirm === "LOGOUT") {
      localStorage.removeItem("token");
      if (onLogout) onLogout();
      setShowLogoutModal(false);
      setLogoutConfirm("");
      setLogoutError("");
      navigate("/login");
    } else {
      setLogoutError("براہ کرم تصدیق کے لیے 'LOGOUT' لکھیں");
    }
  };

  // Text-based link styling with underline on hover
  const navLinkClass = (path) => `
    px-3 py-2 transition-all duration-300 font-urdu text-base font-semibold
    ${location.pathname === path 
      ? 'text-yellow-300 border-b-2 border-yellow-400' 
      : 'text-purple-100 hover:text-white hover:underline underline-offset-4'
    }
  `;

  // Get display username (from prop or fetched data)
  const displayUsername = userData?.username || user?.username || "صارف";

  return (
    <>
      <header 
        dir="rtl"
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled 
          ? "bg-purple-900/90 backdrop-blur-lg shadow-2xl py-2" 
          : "bg-gradient-to-r from-purple-900 to-indigo-900 py-4"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center flex-row">
            
            {/* RIGHT SIDE: Logo Section */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-300">
                <span className="text-2xl">🏪</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-2xl font-black tracking-tight text-white font-urdu leading-none">
                  میرا اسٹور
                </span>
                <span className="text-[10px] uppercase tracking-[2px] text-purple-300 font-sans">
                  Premium Market
                </span>
              </div>
            </Link>

            {/* LEFT SIDE: Desktop Navigation - Enhanced Styling */}
            <nav className="hidden md:flex items-center gap-3">
              {!isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link to="/voice-login" className={navLinkClass("/voice-login")}>
                    🎤 وائس لاگ ان
                  </Link>
                  <span className="text-purple-400 text-lg font-light">✦</span>
                  <Link to="/login" className={navLinkClass("/login")}>
                    لاگ ان
                  </Link>
                  <span className="text-purple-400 text-lg font-light">✦</span>
                  <Link to="/register" className={navLinkClass("/register")}>
                    رجسٹر
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/voice-samples-form" className={navLinkClass("/voice-samples-form")}>
                    🎙️ وائس رجسٹر
                  </Link>
                  
                  <span className="text-purple-400 text-lg font-light">✦</span>
                  
                  <Link to="/profile" className="flex items-center gap-2 group">
                    <span className="text-purple-200 group-hover:text-white transition-colors font-urdu text-sm">
                      خوش آمدید
                    </span>
                    <span className="text-white font-urdu font-bold group-hover:underline underline-offset-4 transition-all">
                      {displayUsername}
                    </span>
                  </Link>

                  <span className="text-purple-400 text-lg font-light">✦</span>

                  <button 
                    onClick={handleLogoutClick} 
                    className="text-purple-100 hover:text-white hover:underline underline-offset-4 transition-all duration-300 font-urdu text-base font-semibold"
                  >
                    🚪 لاگ آؤٹ
                  </button>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown - Enhanced */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 p-5 bg-purple-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl animate-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col gap-2">
                {!isAuthenticated ? (
                  <>
                    <Link 
                      to="/voice-login" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="p-3 hover:bg-white/10 rounded-xl font-urdu text-white font-semibold transition-colors text-center"
                    >
                      🎤 وائس لاگ ان
                    </Link>
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent my-1"></div>
                    <Link 
                      to="/login" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="p-3 hover:bg-white/10 rounded-xl font-urdu text-white font-semibold transition-colors text-center"
                    >
                      لاگ ان
                    </Link>
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent my-1"></div>
                    <Link 
                      to="/register" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="p-3 hover:bg-white/10 rounded-xl font-urdu text-white font-semibold transition-colors text-center"
                    >
                      رجسٹر
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="text-center pb-4 mb-2 border-b border-purple-500/30">
                      <p className="text-xs text-purple-300 font-sans mb-1">خوش آمدید</p>
                      <p className="text-xl font-bold text-white font-urdu bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        {displayUsername}
                      </p>
                    </div>
                    <Link 
                      to="/profile" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="p-3 hover:bg-white/10 rounded-xl font-urdu text-white font-semibold transition-colors text-center"
                    >
                      👤 پروفائل
                    </Link>
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent my-1"></div>
                    <Link 
                      to="/voice-samples-form" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="p-3 hover:bg-white/10 rounded-xl font-urdu text-white font-semibold transition-colors text-center"
                    >
                      🎙️ وائس رجسٹر
                    </Link>
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent my-1"></div>
                    <button 
                      onClick={handleLogoutClick} 
                      className="p-3 text-red-300 hover:bg-red-500/20 rounded-xl font-urdu font-semibold transition-colors text-center"
                    >
                      🚪 لاگ آؤٹ
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full mx-auto my-auto p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-orange-600 mb-4 text-center font-urdu">
              🚪 لاگ آؤٹ کی تصدیق
            </h2>
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl mb-6 text-sm text-orange-700">
              <p className="font-bold mb-2 font-urdu">⚠️ انتباہ!</p>
              <p className="font-urdu">کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟</p>
              <p className="font-urdu text-xs mt-2">آپ کو دوبارہ لاگ ان کرنا ہوگا۔</p>
            </div>
            <input
              type="text"
              value={logoutConfirm}
              onChange={(e) => setLogoutConfirm(e.target.value)}
              placeholder="تصدیق کے لیے LOGOUT لکھیں"
              className="w-full p-3 border-2 border-orange-300 rounded-xl text-center font-mono mb-3 focus:outline-none focus:border-orange-500"
            />
            {logoutError && (
              <p className="text-red-600 text-sm text-center mb-3 font-urdu">
                {logoutError}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  setLogoutConfirm("");
                  setLogoutError("");
                }}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold transition-all font-urdu"
              >
                واپس
              </button>
              <button
                onClick={handleLogoutConfirm}
                disabled={logoutConfirm !== "LOGOUT"}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all font-urdu"
              >
                لاگ آؤٹ کریں
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Spacer to prevent content overlap */}
      <div className="h-24"></div>
    </>
  );
}

export default Header;