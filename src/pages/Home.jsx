// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Home() {
  const [isServerRunning, setIsServerRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeFeature, setActiveFeature] = useState(null);
  const [user, setUser] = useState(null);
  const isAuthenticated = !!localStorage.getItem("token");

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    checkServerConnection();
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const checkServerConnection = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API}/docs`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 200) {
        setIsServerRunning(true);
        setErrorMessage("");
      } else {
        setIsServerRunning(false);
        setErrorMessage("سرور کام نہیں کر رہا");
      }
    } catch (error) {
      setIsServerRunning(false);
      setErrorMessage("سرور کام نہیں کر رہا");
    } finally {
      setIsLoading(false);
    }
  };

  // Voice Command Cards Data
  const voiceCards = [
    {
      id: 1,
      icon: "🎤",
      title: "وائس کمانڈز",
      desc: "آواز سے ادھار، بل، آئٹم شامل کریں",
      link: "/voice-samples-form",
      color: "from-purple-500 to-indigo-600",
      features: ["ادھار شامل کریں", "بل جنریٹ کریں", "آئٹم سرچ کریں"]
    },
    {
      id: 2,
      icon: "📒",
      title: "ادھار مینجمنٹ",
      desc: "کھاتہ کتاب اور ادھار ریکارڈ",
      link: "/udhaar-items",
      color: "from-amber-500 to-orange-600",
      features: ["نیا ادھار", "ادھار لسٹ", "ادھار رپورٹ"]
    },
    {
      id: 3,
      icon: "🧾",
      title: "بل جنریشن",
      desc: "فوری بل بنائیں اور پرنٹ کریں",
      link: "/bill-items",
      color: "from-emerald-500 to-teal-600",
      features: ["نیا بل", "بل ہسٹری", "پرنٹ بل"]
    },
    {
      id: 4,
      icon: "📊",
      title: "رپورٹس",
      desc: "فروخت اور پیشن گوئی رپورٹس",
      link: "/sales-report",
      color: "from-blue-500 to-cyan-600",
      features: ["فروخت رپورٹ", "پیشن گوئی", "آئٹم اینالیسس"]
    }
  ];

  // Quick Action Cards
  const quickActions = [
    { icon: "📦", label: "آئٹمز", link: "/items", bg: "bg-blue-100", hover: "hover:bg-blue-200" },
    { icon: "🛒", label: "اسٹور", link: "/shop", bg: "bg-green-100", hover: "hover:bg-green-200" },
    { icon: "💰", label: "فروخت", link: "/sales", bg: "bg-pink-100", hover: "hover:bg-pink-200" },
    { icon: "👤", label: "پروفائل", link: "/profile", bg: "bg-purple-100", hover: "hover:bg-purple-200" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated={isAuthenticated} user={user} />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏪</span>
              </div>
            </div>
            <p className="text-lg text-gray-700 font-urdu">سرور سے رابطہ ہو رہا ہے...</p>
            <p className="text-sm text-gray-500">براہ کرم انتظار کریں</p>
          </div>
        </div>
        <Footer isAuthenticated={isAuthenticated} />
      </div>
    );
  }

  if (!isServerRunning) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated={isAuthenticated} user={user} />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
          <div className="text-center space-y-6 max-w-md bg-white p-8 rounded-3xl shadow-xl border border-red-100">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-urdu">سرور کنیکٹ نہیں ہو رہا</h2>
            <p className="text-gray-600 font-urdu">{errorMessage}</p>
            <p className="text-sm text-gray-500">براہ کرم یقینی بنائیں کہ بیک اینڈ سرور چل رہا ہے</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={checkServerConnection}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-urdu shadow-lg hover:shadow-xl"
              >
                🔄 دوبارہ کوشش کریں
              </button>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-purple-500 hover:text-purple-600 transition-all font-urdu"
              >
                📚 API Docs
              </a>
            </div>
          </div>
        </div>
        <Footer isAuthenticated={isAuthenticated} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header isAuthenticated={isAuthenticated} user={user} />
      
      <main className="flex-1">
        {/* ===== HERO SECTION ===== */}
        <section className="relative overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            {/* Header */}
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full mb-6">
                <span className="text-lg">✨</span>
                <span className="text-sm font-medium text-purple-700 font-urdu">اردو وائس سپورٹ کے ساتھ</span>
              </div>
              
             <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8 font-urdu leading-snug">
  <span className="block mb-2">میرا اسٹور</span>
  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 py-2">
    سمارٹ مینجمنٹ سسٹم
  </span>
</h1>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-urdu leading-relaxed">
                آواز کے ذریعے ادھار، بل، اور آئٹمز مینج کریں۔ 
                <span className="text-purple-600 font-semibold">آسان، تیز، اور جدید</span>
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link
                to="/login"
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg font-urdu shadow-lg hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
              >
                🔐 لاگ ان کریں
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold text-lg font-urdu hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center gap-2"
              >
                🆕 اکاؤنٹ بنائیں
              </Link>
              <Link
                to="/voice-login"
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-lg font-urdu shadow-lg hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
              >
                🎤 وائس لاگ ان
              </Link>
            </div>

            {/* Quick Access Icons - Only show if logged in */}
            {isAuthenticated && (
              <div className="flex justify-center gap-3 md:gap-4 flex-wrap">
                {quickActions.map((action, idx) => (
                  <Link
                    key={idx}
                    to={action.link}
                    className={`${action.bg} ${action.hover} p-4 md:p-5 rounded-2xl transition-all hover:scale-105 hover:shadow-lg flex flex-col items-center gap-2 min-w-20`}
                  >
                    <span className="text-2xl md:text-3xl">{action.icon}</span>
                    <span className="text-sm font-medium text-gray-700 font-urdu">{action.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ===== VOICE COMMAND CARDS ===== */}
        <section className="py-12 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-urdu">
                🎤 وائس کمانڈز سے کام کریں
              </h2>
              <p className="text-gray-600 font-urdu text-lg">
                صرف بولیں، باقی ہم سنبھال لیں گے
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {voiceCards.map((card) => (
                <Link
                  key={card.id}
                  to={card.link}
                  className="group relative bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent overflow-hidden"
                  onMouseEnter={() => setActiveFeature(card.id)}
                  onMouseLeave={() => setActiveFeature(null)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity rounded-3xl`}></div>
                  
                  <div className="relative z-10">
                    <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      {card.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-urdu group-hover:text-purple-700 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-gray-600 mb-4 font-urdu text-sm leading-relaxed">
                      {card.desc}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {card.features.map((feature, idx) => (
                        <span 
                          key={idx}
                          className={`px-3 py-1 text-xs rounded-full font-medium font-urdu transition-colors ${
                            activeFeature === card.id 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-gray-100 text-gray-600 group-hover:bg-purple-50 group-hover:text-purple-600'
                          }`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-purple-600 text-lg font-bold">↗</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FEATURE HIGHLIGHTS ===== */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-urdu">
                ✨ اہم فیچرز
              </h2>
              <p className="text-gray-600 font-urdu text-lg">
                آپ کے اسٹور کے لیے مکمل حل
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
                  🗣️
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center font-urdu">
                  اردو وائس ان پٹ
                </h3>
                <p className="text-gray-600 text-center font-urdu leading-relaxed">
                  اردو میں بول کر ادھار، بل، اور آئٹمز شامل کریں۔ 
                  جدید AI ٹیکنالوجی کے ساتھ درست پہچان۔
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
                  🧾
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center font-urdu">
                  فوری بل پرنٹ
                </h3>
                <p className="text-gray-600 text-center font-urdu leading-relaxed">
                  ایک کمانڈ سے بل جنریٹ اور پرنٹ کریں۔ 
                  تھرمل پرنٹر سپورٹ کے ساتھ۔
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
                  📈
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center font-urdu">
                  اسمارٹ رپورٹس
                </h3>
                <p className="text-gray-600 text-center font-urdu leading-relaxed">
                  فروخت، ادھار، اور پیشن گوئی رپورٹس۔ 
                  ڈیٹا پر مبنی فیصلے کریں۔
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section className="py-16 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-urdu">
              🚀 آج ہی شروع کریں!
            </h2>
            <p className="text-purple-100 text-lg mb-8 font-urdu">
              اپنا اسٹور مینجمنٹ سسٹم سیٹ اپ کریں اور وقت بچائیں
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 bg-white text-purple-700 rounded-2xl font-bold text-lg font-urdu shadow-lg hover:shadow-2xl transition-all hover:scale-105"
              >
                🆓 مفت شروع کریں
              </Link>
              <a
                href="#demo"
                className="px-8 py-4 border-2 border-white text-white rounded-2xl font-bold text-lg font-urdu hover:bg-white/10 transition-all"
              >
                🎬 ڈیمو دیکھیں
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default Home;