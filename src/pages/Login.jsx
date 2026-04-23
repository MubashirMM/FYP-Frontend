import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const API = import.meta.env.VITE_API_URL;
  const isAuthenticated = !!localStorage.getItem("token");

  useEffect(() => {
    setForm({ email: "", password: "" });
    setErrors({});
    setSuccessMessage("");
  }, []);

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "ای میل درج کریں";
    if (!emailRegex.test(email)) return "درست ای میل ایڈریس درج کریں (example@domain.com)";
    return "";
  };

  // Password validation - only check for empty
  const validatePassword = (password) => {
    if (!password) return "پاس ورڈ درج کریں";
    return "";
  };

  const handleFieldChange = (field, value) => {
    setForm({ ...form, [field]: value });
    
    // Clear error for this field when user starts typing
    setErrors({ ...errors, [field]: "" });
    setSuccessMessage("");
    
    // Real-time validation
    let errorMsg = "";
    if (field === "email") errorMsg = validateEmail(value);
    else if (field === "password") errorMsg = validatePassword(value);
    
    if (errorMsg) {
      setErrors({ ...errors, [field]: errorMsg });
    }
  };

  const validateForm = () => {
    const emailError = validateEmail(form.email.trim());
    const passwordError = validatePassword(form.password);
    
    const newErrors = {
      email: emailError,
      password: passwordError
    };
    
    setErrors(newErrors);
    
    return !emailError && !passwordError;
  };

  // Helper function to set error with auto-clear after 3 seconds
  const setErrorWithTimeout = (errorType, errorMessage) => {
    setErrors({ [errorType]: errorMessage });
    
    // Clear error after 3 seconds
    setTimeout(() => {
      setErrors(prev => ({ ...prev, [errorType]: "" }));
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${API}/auth/login`,
        new URLSearchParams({
          username: form.email,
          email: form.email,
          password: form.password,
        })
      );
      
      localStorage.setItem("token", res.data.access_token);
      setSuccessMessage("✅ لاگ ان کامیاب! ڈیش بورڈ پر جا رہے ہیں...");
      
      setTimeout(() => {
        navigate("/items");
      }, 2000);
      
    } catch (err) {
      const errorDetail = err.response?.data?.detail || "";
      
      // Check different error scenarios - DON'T clear the form
      if (errorDetail.includes("User not found") || errorDetail.includes("username") || errorDetail.includes("email")) {
        setErrorWithTimeout("email", "❌ یہ ای میل رجسٹرڈ نہیں ہے۔ براہ کرم پہلے رجسٹر کریں");
      } else if (errorDetail.includes("Incorrect password") || errorDetail.includes("password")) {
        setErrorWithTimeout("password", "❌ پاس ورڈ غلط ہے۔ براہ کرم درست پاس ورڈ درج کریں");
      } else {
        setErrorWithTimeout("submit", errorDetail || "❌ لاگ ان میں خرابی۔ براہ کرم دوبارہ کوشش کریں");
      }
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
          
          {/* Submit Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right font-urdu animate-fade-in">
              {errors.submit}
            </div>
          )}
          
          {/* Success Message */}
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
                className={`w-full px-4 py-3 border-2 rounded-xl text-right font-urdu focus:outline-none focus:ring-2 transition-all placeholder:text-right ${
                  errors.email 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                    : "border-gray-300 focus:border-purple-500 focus:ring-purple-200"
                }`}
                placeholder="ای میل درج کریں" 
                value={form.email}
                autoComplete="off"
                onChange={(e) => handleFieldChange("email", e.target.value)}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 text-right font-urdu animate-fade-in">
                  {errors.email}
                </p>
              )}
            </div>
            
            {/* Password Field */}
            <div>
              <input
                type="password"
                className={`w-full px-4 py-3 border-2 rounded-xl text-right font-urdu focus:outline-none focus:ring-2 transition-all placeholder:text-right ${
                  errors.password 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                    : "border-gray-300 focus:border-purple-500 focus:ring-purple-200"
                }`}
                placeholder="پاس ورڈ درج کریں"
                value={form.password}
                autoComplete="new-password" 
                onChange={(e) => handleFieldChange("password", e.target.value)}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 text-right font-urdu animate-fade-in">
                  {errors.password}
                </p>
              )}
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