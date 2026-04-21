import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const API = import.meta.env.VITE_API_URL;
  const isAuthenticated = !!localStorage.getItem("token");

  useEffect(() => {
    setForm({ username: "", password: "" });
    setError("");
    setSuccessMessage("");
  }, []);

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "ای میل درج کریں";
    if (!emailRegex.test(email)) return "درست ای میل ایڈریس درج کریں (example@domain.com)";
    return "";
  };

  const validateForm = () => {
    // Validate email
    const emailError = validateEmail(form.username.trim());
    if (emailError) {
      setError(emailError);
      return false;
    }
    
    // Validate password
    if (!form.password) {
      setError("پاس ورڈ درج کریں");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${API}/auth/login`,
        new URLSearchParams({
          username: form.username,
          email: form.username,
          password: form.password,
        })
      );
      
      localStorage.setItem("token", res.data.access_token);
      setSuccessMessage("✅ لاگ ان کامیاب! ڈیش بورڈ پر جا رہے ہیں...");
      
      setTimeout(() => {
        navigate("/items");
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || "❌ لاگ ان میں خرابی: ای میل یا پاس ورڈ غلط ہے");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header isAuthenticated={isAuthenticated} user={null} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6 font-urdu">
            لاگ ان کریں
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right font-urdu">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right animate-pulse font-urdu">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            {/* Email Field */}
            <div>
              <input
                type="email"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right font-urdu focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-right"
                placeholder="ای میل درج کریں" 
                value={form.username}
                autoComplete="off"
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              
            </div>
            
            {/* Password Field */}
            <div>
              <input
                type="password"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right font-urdu focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-right"
                placeholder="پاس ورڈ درج کریں"
                value={form.password}
                autoComplete="new-password" 
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-urdu text-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>لاگ ان ہو رہا ہے...</span>
                </>
              ) : (
                "لاگ ان کریں"
              )}
            </button>
          </form>
        </div>

        {/* Links Section - Outside the card */}
        <div className="mt-6 text-center space-y-3">
          {/* First Row: Two links side by side */}
          <div className="flex justify-center gap-8">
            <Link 
              to="/forgot-password" 
              className="text-purple-600 hover:text-purple-800 font-urdu text-sm flex items-center gap-1 transition-all duration-200 hover:underline underline-offset-2"
            >
              <span>🔑</span> پاس ورڈ یاد نہیں؟
            </Link>
            <Link 
              to="/voice-login" 
              className="text-purple-600 hover:text-purple-800 font-urdu text-sm flex items-center gap-1 transition-all duration-200 hover:underline underline-offset-2"
            >
              <span>🎤</span> وائس لاگ ان
            </Link>
          </div>
          
          {/* Second Row: Register link */}
          <div>
            <p className="text-gray-600 font-urdu">
              اکاؤنٹ نہیں ہے؟{" "}
              <Link 
                to="/register" 
                className="text-purple-600 hover:text-purple-800 font-semibold transition-all duration-200 hover:underline underline-offset-2"
              >
                رجسٹر کریں
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default Login;