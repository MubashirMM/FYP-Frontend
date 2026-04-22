// src/components/Header.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function Header({ user, isAuthenticated, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (onLogout) onLogout();
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  const navLinkClass = (path) => `
    px-4 py-2 rounded-xl transition-all duration-300 font-urdu flex items-center gap-2
    ${location.pathname === path ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-purple-100'}
  `;

  return (
    <>
      {/* Added dir="rtl" to the whole header for correct Urdu alignment */}
      <header 
        dir="rtl"
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled 
          ? "bg-purple-900/80 backdrop-blur-lg shadow-2xl py-2" 
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

            {/* LEFT SIDE: Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              {!isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link to="/voice-login" className="px-5 py-2.5 bg-white text-purple-900 rounded-xl font-bold font-urdu shadow-lg hover:bg-purple-50 transition-colors flex items-center gap-2">
                    <span className="animate-pulse">🎤</span> وائس لاگ ان
                  </Link>
                  <div className="w-px h-4 bg-white/20 mx-1" />
                  <Link to="/login" className={navLinkClass("/login")}>
                    لاگ ان
                  </Link>
                  <Link to="/register" className={navLinkClass("/register")}>
                    رجسٹر
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <Link to="/profile" className="flex items-center gap-3 group">
                    <div className="text-left"> {/* Keep English welcome text/username left-aligned or change to right */}
                      <p className="text-xs text-purple-300 font-sans text-left">خوش آمدید</p>
                      <p className="text-sm font-bold text-white font-urdu">{user?.username || "صارف"}</p>
                    </div>
                    <div className="w-10 h-10 border-2 border-purple-400/50 rounded-full overflow-hidden p-0.5 group-hover:border-white transition-colors">
                      <div className="w-full h-full bg-purple-700 rounded-full flex items-center justify-center text-lg shadow-inner">
                        {user?.username?.charAt(0).toUpperCase() || "👤"}
                      </div>
                    </div>
                  </Link>
                  
                  <div className="h-8 w-px bg-white/20" />
                  
                  <Link to="/voice-samples-form" className={navLinkClass("/voice-samples-form")}>
                    <span>🎙️</span> وائس رجسٹر
                  </Link>

                  <button 
                    onClick={handleLogout} 
                    className="text-purple-200 hover:text-white transition-colors font-urdu text-sm flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg"
                  >
                    <span>🚪</span> لاگ آؤٹ
                  </button>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button (Positioned on the Left for RTL) */}
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

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 p-4 bg-purple-950/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-top-4 duration-300 text-right">
              <div className="flex flex-col gap-2">
                {!isAuthenticated ? (
                  <>
                    <Link to="/voice-login" onClick={() => setIsMobileMenuOpen(false)} className="flex justify-between items-center p-3 bg-white text-purple-900 rounded-xl font-urdu font-bold">
                      <span>وائس لاگ ان</span>
                      <span>🎤</span>
                    </Link>
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="p-3 hover:bg-white/10 rounded-xl font-urdu">لاگ ان</Link>
                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="p-3 hover:bg-white/10 rounded-xl font-urdu">رجسٹر</Link>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-start gap-3 pb-4 mb-2 border-b border-white/10 flex-row-reverse">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">👤</div>
                      <span className="font-urdu text-white">{user?.username}</span>
                    </div>
                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="p-3 hover:bg-white/10 rounded-xl font-urdu">👤 پروفائل</Link>
                    <Link to="/voice-samples-form" onClick={() => setIsMobileMenuOpen(false)} className="p-3 hover:bg-white/10 rounded-xl font-urdu">🎙️ وائس رجسٹر</Link>
                    <button onClick={handleLogout} className="w-full text-right p-3 text-red-300 hover:bg-red-500/10 rounded-xl font-urdu flex items-center justify-between">
                      <span>لاگ آؤٹ</span>
                      <span>🚪</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      {/* Spacer to prevent content overlap */}
      <div className="h-24"></div>
    </>
  );
}

export default Header;