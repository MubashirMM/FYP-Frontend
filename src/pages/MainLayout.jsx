import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function MainLayout() {
  const [isOpen, setIsOpen] = useState(true); // Changed to true for desktop default
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, getAuthHeader());
      setUser(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchUser();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Close sidebar on mobile when navigating
  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-right" dir="rtl">
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static top-0 right-0 z-50 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white
        transition-all duration-300 ease-in-out shadow-2xl
        ${isOpen ? "w-64 translate-x-0" : "w-64 translate-x-full md:translate-x-0 md:w-20"}
      `}>
        {/* Sidebar Header with Toggle Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {isOpen && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-lg">🏪</span>
              </div>
              <span className="text-lg font-bold">میرا اسٹور</span>
            </div>
          )}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className={`p-2 hover:bg-gray-700 rounded-xl transition-colors ${!isOpen ? 'mx-auto' : ''}`}
          >
            <span className="text-xl">{isOpen ? "◀" : "☰"}</span>
          </button>
        </div>

        <nav className="mt-6 flex flex-col gap-1 px-2">
          <SidebarItem 
            to="/main" 
            icon="🏠" 
            label="مین ڈیش بورڈ" 
            isOpen={isOpen} 
            onClick={closeSidebar}
            isActive={location.pathname === "/main"}
          />
          <SidebarItem 
            to="/items" 
            icon="📦" 
            label="آئٹمز مینجمنٹ" 
            isOpen={isOpen} 
            onClick={closeSidebar}
            isActive={location.pathname === "/items"}
          />
          <SidebarItem 
            to="/udhaar-items" 
            icon="📋" 
            label="اُدھار آئٹمز" 
            isOpen={isOpen} 
            onClick={closeSidebar}
            isActive={location.pathname === "/udhaar-items"}
          />
          <SidebarItem 
            to="/bill-items" 
            icon="📝" 
            label="بل آئٹمز" 
            isOpen={isOpen} 
            onClick={closeSidebar}
            isActive={location.pathname === "/bill-items"}
          />
          <SidebarItem 
            to="/khata" 
            icon="📒" 
            label="کھاتہ کتاب" 
            isOpen={isOpen} 
            onClick={closeSidebar}
            isActive={location.pathname === "/khata"}
          />
          <SidebarItem 
            to="/bills" 
            icon="📄" 
            label="بلز مینجمنٹ" 
            isOpen={isOpen} 
            onClick={closeSidebar}
            isActive={location.pathname === "/bills"}
          />
          <SidebarItem 
            to="/sales" 
            icon="💰" 
            label="فروخت کی ریکارڈ" 
            isOpen={isOpen} 
            onClick={closeSidebar}
            isActive={location.pathname === "/sales"}
          />
          <SidebarItem 
  to="/bill-item-history" 
  icon="📜" 
  label="بل آئٹم ہسٹری" 
  isOpen={isOpen} 
  onClick={closeSidebar}
  isActive={location.pathname === "/bill-item-history"}
/>
          <SidebarItem 
            to="/shop" 
            icon="🛒" 
            label="اسٹور سیٹنگز" 
            isOpen={isOpen} 
            onClick={closeSidebar}
            isActive={location.pathname === "/shop"}
          />

          <div className="mt-auto border-t border-gray-700 pt-4 mt-6">
            <SidebarItem 
              to="#" 
              icon="🚪" 
              label="لاگ آؤٹ" 
              isOpen={isOpen} 
              isActive={false}
              onClick={(e) => { e.preventDefault(); handleLogout(); }} 
            />
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-6 shadow-md">
          {/* LEFT: Mobile Menu Button + Store Name Clickable */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsOpen(true)} 
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              ☰
            </button>
            <Link 
              to="/main" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-md">
                🏪
              </div>
              <h1 className="text-xl font-bold text-gray-800 hidden md:block">میرا اسٹور</h1>
            </Link>
          </div>

          {/* RIGHT: Profile */}
          <div className="flex items-center gap-3">
            {user && (
              <Link 
                to="/profile"
                onClick={closeSidebar}
                className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-2xl transition-colors group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform">
                  {user.username?.charAt(0).toUpperCase() || "👤"}
                </div>
                <div className="hidden md:block text-right">
                  <p className="font-semibold text-gray-800">{user.username}</p>
                  <p className="text-xs text-gray-500">ID: {user.user_id}</p>
                </div>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ to, icon, label, isOpen, onClick, isActive }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`
        flex items-center px-4 py-3 rounded-xl transition-all duration-200
        ${!isOpen ? 'md:justify-center' : ''}
        ${isActive 
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
          : 'hover:bg-gray-800 text-gray-300 hover:text-white'
        }
      `}
    >
      <span className={`text-xl ${isActive ? 'scale-110' : ''}`}>{icon}</span>
      <span className={`
        mr-4 font-medium whitespace-nowrap transition-all duration-200
        ${!isOpen ? 'md:hidden md:opacity-0' : 'block opacity-100'}
        ${isActive ? 'font-bold' : ''}
      `}>
        {label}
      </span>
    </Link>
  );
}

export default MainLayout;