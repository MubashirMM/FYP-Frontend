// import { useState, useEffect } from "react";
// import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
// import axios from "axios";

// const API = import.meta.env.VITE_API_URL;

// function MainLayout() {
//   const [isOpen, setIsOpen] = useState(true);
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();
//   const location = useLocation();

//   const getAuthHeader = () => ({
//     headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//   });

//   const fetchUser = async () => {
//     try {
//       const res = await axios.get(`${API}/auth/me`, getAuthHeader());
//       setUser(res.data);
//     } catch (err) {
//       if (err.response?.status === 401) {
//         localStorage.removeItem("token");
//         navigate("/login");
//       }
//     }
//   };

//   useEffect(() => {
//     if (localStorage.getItem("token")) {
//       fetchUser();
//     } else {
//       navigate("/login");
//     }
//   }, [navigate]);

//   const closeSidebar = () => {
//     if (window.innerWidth < 768) {
//       setIsOpen(false);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     navigate("/login");
//   };

//   // Menu items list for easy management
//   const menuItems = [
//     // { to: "/main", icon: "🏠", label: "مین ڈیش بورڈ" },
//     { to: "/items", icon: "📦", label: "آئٹمز مینجمنٹ" },
//     { to: "/udhaar-items", icon: "📋", label: "اُدھار آئٹمز" },
//     { to: "/bill-items", icon: "📝", label:"نقد آئٹمز" },
//     { to: "/khata", icon: "📒", label: "کھاتہ کتاب" },
//     { to: "/bills", icon: "📄", label: "بلز مینجمنٹ" },
//     { to: "/sales", icon: "💰", label: "فروخت کی ریکارڈ" },
//     { to: "/bill-item-history", icon: "📜", label: "بل آئٹم ہسٹری" },
//     { to: "/shop", icon: "🛒", label: "اسٹور سیٹنگز" },
//     { to: "/sales-report", icon: "📊", label: "فروخت رپورٹ" },
//       { to: "/forecast-report", icon: "🔮", label: "پیشن گوئی رپورٹ" },  
//   ];

//   return (
//     <div className="flex h-screen overflow-hidden bg-gray-50 text-right" dir="rtl">
//       {/* Mobile overlay */}
//       {isOpen && (
//         <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
//       )}

//       {/* Sidebar */}
//       <aside className={`
//         fixed md:sticky top-0 right-0 z-50 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white
//         transition-all duration-300 ease-in-out shadow-2xl flex flex-col
//         ${isOpen ? "w-64 translate-x-0" : "w-64 translate-x-full md:translate-x-0 md:w-20"}
//       `}>
//         {/* Sidebar Header with Toggle Button */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
//           {isOpen && (
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
//                 <span className="text-lg">🏪</span>
//               </div>
//               <span className="text-lg font-bold">میرا اسٹور</span>
//             </div>
//           )}
//           <button 
//             onClick={() => setIsOpen(!isOpen)} 
//             className={`p-2 hover:bg-gray-700 rounded-xl transition-colors ${!isOpen ? 'mx-auto' : ''}`}
//           >
//             <span className="text-xl">{isOpen ? "◀" : "☰"}</span>
//           </button>
//         </div>

//         {/* Scrollable Menu Items */}
//         <nav className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
//           <div className="flex flex-col gap-1">
//             {menuItems.map((item) => (
//               <SidebarItem 
//                 key={item.to}
//                 to={item.to} 
//                 icon={item.icon} 
//                 label={item.label} 
//                 isOpen={isOpen} 
//                 onClick={closeSidebar}
//                 isActive={location.pathname === item.to}
//               />
//             ))}
//           </div>
//         </nav>

//         {/* Logout Button - Fixed at bottom */}
//         <div className="border-t border-gray-700 p-2 shrink-0">
//           <SidebarItem 
//             to="#" 
//             icon="🚪" 
//             label="لاگ آؤٹ" 
//             isOpen={isOpen} 
//             isActive={false}
//             onClick={(e) => { e.preventDefault(); handleLogout(); }} 
//           />
//         </div>
//       </aside>

//       <div className="flex-1 flex flex-col min-w-0">
//         {/* HEADER */}
//         <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-6 shadow-md shrink-0">
//           {/* LEFT: Mobile Menu Button + Store Name Clickable */}
//           <div className="flex items-center gap-3">
//             <button 
//               onClick={() => setIsOpen(true)} 
//               className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
//             >
//               ☰
//             </button>
//             <Link 
//               to="/items" 
//               className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
//             >
//               <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-md">
//                 🏪
//               </div>
//               <h1 className="text-xl font-bold text-gray-800 hidden md:block">میرا اسٹور</h1>
//             </Link>
//           </div>

//           {/* RIGHT: Profile */}
//           <div className="flex items-center gap-3">
//             {user && (
//               <Link 
//                 to="/profile"
//                 onClick={closeSidebar}
//                 className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-2xl transition-colors group"
//               >
//                 <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform">
//                   {user.username?.charAt(0).toUpperCase() || "👤"}
//                 </div>
//                 <div className="hidden md:block text-right">
//                   <p className="font-semibold text-gray-800">{user.username}</p>
//                   <p className="text-xs text-gray-500">ID: {user.user_id}</p>
//                 </div>
//               </Link>
//             )}
//           </div>
//         </header>

//         <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }

// function SidebarItem({ to, icon, label, isOpen, onClick, isActive }) {
//   return (
//     <Link 
//       to={to} 
//       onClick={onClick}
//       className={`
//         flex items-center px-4 py-3 rounded-xl transition-all duration-200
//         ${!isOpen ? 'md:justify-center' : ''}
//         ${isActive 
//           ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
//           : 'hover:bg-gray-800 text-gray-300 hover:text-white'
//         }
//       `}
//     >
//       <span className={`text-xl ${isActive ? 'scale-110' : ''}`}>{icon}</span>
//       <span className={`
//         mr-4 font-medium whitespace-nowrap transition-all duration-200
//         ${!isOpen ? 'md:hidden md:opacity-0' : 'block opacity-100'}
//         ${isActive ? 'font-bold' : ''}
//       `}>
//         {label}
//       </span>
//     </Link>
//   );
// }

// export default MainLayout;


import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function MainLayout() {
  const [isOpen, setIsOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState("");
  const [logoutError, setLogoutError] = useState("");
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

  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setLogoutConfirm("");
    setLogoutError("");
  };

  const handleLogoutConfirm = () => {
    if (logoutConfirm === "LOGOUT") {
      localStorage.removeItem("token");
      setShowLogoutModal(false);
      setLogoutConfirm("");
      setLogoutError("");
      navigate("/login");
    } else {
      setLogoutError("براہ کرم تصدیق کے لیے 'LOGOUT' لکھیں");
    }
  };

  // Menu items list for easy management
  const menuItems = [
    { to: "/items", icon: "📦", label: "آئٹمز مینجمنٹ" },
    { to: "/udhaar-items", icon: "📋", label: "اُدھار آئٹمز" },
    { to: "/bill-items", icon: "📝", label:"نقد آئٹمز" },
    { to: "/khata", icon: "📒", label: "کھاتہ کتاب" },
    { to: "/bills", icon: "📄", label: "بلز مینجمنٹ" },
    { to: "/sales", icon: "💰", label: "فروخت کی ریکارڈ" },
    { to: "/bill-item-history", icon: "📜", label: "بل آئٹم ہسٹری" },
    { to: "/shop", icon: "🛒", label: "اسٹور سیٹنگز" },
    { to: "/sales-report", icon: "📊", label: "فروخت رپورٹ" },
    { to: "/forecast-report", icon: "🔮", label: "پیشن گوئی رپورٹ" },  
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-right" dir="rtl">
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 right-0 z-50 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white
        transition-all duration-300 ease-in-out shadow-2xl flex flex-col
        ${isOpen ? "w-64 translate-x-0" : "w-64 translate-x-full md:translate-x-0 md:w-20"}
      `}>
        {/* Sidebar Header with Toggle Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
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

        {/* Scrollable Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
          <div className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <SidebarItem 
                key={item.to}
                to={item.to} 
                icon={item.icon} 
                label={item.label} 
                isOpen={isOpen} 
                onClick={closeSidebar}
                isActive={location.pathname === item.to}
              />
            ))}
          </div>
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="border-t border-gray-700 p-2 shrink-0">
          <button
            onClick={handleLogoutClick}
            className={`
              flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200
              ${!isOpen ? 'md:justify-center' : ''}
              hover:bg-gray-800 text-gray-300 hover:text-white
            `}
          >
            <span className="text-xl">🚪</span>
            <span className={`
              mr-4 font-medium whitespace-nowrap transition-all duration-200
              ${!isOpen ? 'md:hidden md:opacity-0' : 'block opacity-100'}
            `}>
              لاگ آؤٹ
            </span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER - Original style (white background, no gradient) */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-6 shadow-md shrink-0">
          {/* LEFT: Mobile Menu Button + Store Name Clickable */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsOpen(true)} 
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              ☰
            </button>
            <Link 
              to="/items" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-md">
                🏪
              </div>
              <h1 className="text-xl font-bold text-gray-800 hidden md:block">میرا اسٹور</h1>
            </Link>
          </div>

          {/* RIGHT: Profile with Logout Button */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-4">
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
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <span className="text-lg">🚪</span>
                  <span className="hidden md:inline font-urdu">لاگ آؤٹ</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full mx-auto my-auto p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-orange-600 mb-4 text-center font-urdu">
              🚪 لاگ آؤٹ کی تصدیق
            </h2>

            {/* Warning */}
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl mb-6 text-sm text-orange-700">
              <p className="font-bold mb-2 font-urdu">⚠️ انتباہ!</p>
              <p className="font-urdu">کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟</p>
              <p className="font-urdu text-xs mt-2">آپ کو دوبارہ لاگ ان کرنا ہوگا۔</p>
            </div>

            {/* Confirm Input */}
            <input
              type="text"
              value={logoutConfirm}
              onChange={(e) => setLogoutConfirm(e.target.value)}
              placeholder="تصدیق کے لیے LOGOUT لکھیں"
              className="w-full p-3 border-2 border-orange-300 rounded-xl text-center font-mono mb-3 focus:outline-none focus:border-orange-500"
            />

            {/* Error */}
            {logoutError && (
              <p className="text-red-600 text-sm text-center mb-3 font-urdu">
                {logoutError}
              </p>
            )}

            {/* Buttons */}
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