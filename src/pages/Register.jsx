import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Register() {
  const [form, setForm] = useState({ 
    email: "", 
    username: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const passwordFieldRef = useRef(null);
  const navigate = useNavigate();
  
  const API = import.meta.env.VITE_API_URL;
  const isAuthenticated = !!localStorage.getItem("token");

  // Force clear form fields on refresh to prevent ghost data
  useEffect(() => {
    setForm({ email: "", username: "", password: "", confirmPassword: "" });
    setErrors({});
    setSuccessMessage("");
  }, []);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "ای میل درج کریں";
    if (!emailRegex.test(email)) return "درست ای میل ایڈریس درج کریں (example@domain.com)";
    return "";
  };

  const validateUsername = (username) => {
    if (!username) return "یوزر نیم درج کریں";
    if (username.length < 3) return "یوزر نیم کم از کم 3 حروف کا ہونا چاہیے";
    if (username.length > 20) return "یوزر نیم زیادہ سے زیادہ 20 حروف کا ہو سکتا ہے";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "یوزر نیم صرف حروف، اعداد اور انڈر اسکور پر مشتمل ہو سکتا ہے";
    return "";
  };

  const checkPasswordStrength = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("کم از کم 8 حروف");
    if (!/[A-Z]/.test(password)) errors.push("ایک بڑا حرف (A-Z)");
    if (!/[a-z]/.test(password)) errors.push("ایک چھوٹا حرف (a-z)");
    if (!/[0-9]/.test(password)) errors.push("ایک عدد (0-9)");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("ایک خاص حرف (!@#$%^&*)");
    return errors;
  };

  const validatePassword = (password) => {
    if (!password) return "پاس ورڈ درج کریں";
    if (password.length < 8) return "پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے";
    if (password.length > 30) return "پاس ورڈ زیادہ سے زیادہ 30 حروف کا ہو سکتا ہے";
    const strengthErrors = checkPasswordStrength(password);
    if (strengthErrors.length > 0) return "پاس ورڈ کمزور ہے";
    return "";
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) return "پاس ورڈ کی تصدیق کریں";
    if (password !== confirmPassword) return "پاس ورڈ اور کنفرم پاس ورڈ ایک جیسے ہونے چاہئیں";
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
    else if (field === "username") errorMsg = validateUsername(value);
    else if (field === "password") {
      errorMsg = validatePassword(value);
      const strengthErrors = checkPasswordStrength(value);
      setPasswordErrors(strengthErrors);
      
      // Also validate confirm password if it exists
      if (form.confirmPassword && !errorMsg) {
        const confirmError = validateConfirmPassword(value, form.confirmPassword);
        if (confirmError) setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
        else setErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    } else if (field === "confirmPassword") {
      errorMsg = validateConfirmPassword(form.password, value);
    }
    
    if (errorMsg) {
      setErrors({ ...errors, [field]: errorMsg });
    }
  };

  const handlePasswordFocus = () => {
    if (form.password) {
      const strengthErrors = checkPasswordStrength(form.password);
      setPasswordErrors(strengthErrors);
      setShowPasswordTooltip(true);
    }
  };

  const handlePasswordBlur = () => {
    setTimeout(() => setShowPasswordTooltip(false), 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSuccessMessage("");
    setErrors({});
    
    const emailError = validateEmail(form.email);
    const usernameError = validateUsername(form.username);
    const passwordError = validatePassword(form.password);
    const confirmPasswordError = validateConfirmPassword(form.password, form.confirmPassword);
    
    const newErrors = {
      email: emailError,
      username: usernameError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    };
    
    setErrors(newErrors);
    
    if (emailError || usernameError || passwordError || confirmPasswordError) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await axios.post(`${API}/auth/register`, {
        email: form.email,
        username: form.username,
        password: form.password,
        voice_samples: [] 
      });
      
      setSuccessMessage(res.data.detail || "اکاؤنٹ کامیابی سے بن گیا!");
      setForm({ email: "", username: "", password: "", confirmPassword: "" });
      
      setTimeout(() => {
        navigate("/voice-samples-form", { state: { email: form.email } });
      }, 2000);
      
    } catch (err) {
      setErrors({ 
        submit: err.response?.data?.detail || "رجسٹریشن میں خرابی۔ براہ کرم دوبارہ کوشش کریں" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header isAuthenticated={isAuthenticated} user={null} onLogout={handleLogout} />
      
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md relative">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6 font-urdu">
            اکاؤنٹ بنائیں
          </h2>
          
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right animate-pulse">
              ✅ {successMessage}
              <p className="text-sm mt-1">صوتی نمونے والے صفحے پر جا رہے ہیں...</p>
            </div>
          )}
          
          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right">
              ❌ {errors.submit}
            </div>
          )}
          
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            {/* Email Field */}
            <div>
              <input 
                type="email" 
                placeholder="ای میل درج کریں" 
                value={form.email} 
                autoComplete="off"
                onChange={e => handleFieldChange("email", e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg text-right font-urdu transition-all focus:outline-none focus:ring-2 ${
                  errors.email 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                    : "border-gray-300 focus:border-purple-500 focus:ring-purple-200"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 text-right font-urdu">{errors.email}</p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <input 
                type="text" 
                placeholder="یوزر نیم درج کریں" 
                value={form.username} 
                autoComplete="off"
                onChange={e => handleFieldChange("username", e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg text-right font-urdu transition-all focus:outline-none focus:ring-2 ${
                  errors.username 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                    : "border-gray-300 focus:border-purple-500 focus:ring-purple-200"
                }`}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1 text-right font-urdu">{errors.username}</p>
              )}
            </div>

            {/* Password Field with Floating Tooltip */}
            <div className="relative">
              <input 
                ref={passwordFieldRef}
                type="password" 
                placeholder="پاس ورڈ درج کریں" 
                value={form.password} 
                autoComplete="new-password"
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                onChange={e => handleFieldChange("password", e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg text-right font-urdu transition-all focus:outline-none focus:ring-2 ${
                  errors.password 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                    : "border-gray-300 focus:border-purple-500 focus:ring-purple-200"
                }`}
              />
              
              {/* Floating Tooltip - appears on the right side */}
              {showPasswordTooltip && passwordErrors.length > 0 && (
                <div className="absolute top-0 left-full ml-2 z-50 w-64 bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden animate-fade-in">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-bold text-right font-urdu">
                    پاس ورڈ کی شرائط
                  </div>
                  <div className="p-3 space-y-1">
                    {passwordErrors.map((error, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-300 font-urdu">
                        <span className="text-red-400">✗</span>
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-800 px-3 py-1 text-xs text-gray-400 text-right font-urdu">
                    ان شرائط کو پورا کریں
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 text-right font-urdu">{errors.password}</p>
              )}
              
              {/* Password strength indicator */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    <div className={`h-1 flex-1 rounded-full transition-all ${
                      form.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-all ${
                      /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-all ${
                      /[0-9]/.test(form.password) ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-all ${
                      /[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <input 
                type="password" 
                placeholder="پاس ورڈ دوبارہ درج کریں" 
                value={form.confirmPassword} 
                autoComplete="new-password"
                onChange={e => handleFieldChange("confirmPassword", e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg text-right font-urdu transition-all focus:outline-none focus:ring-2 ${
                  errors.confirmPassword 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                    : "border-gray-300 focus:border-purple-500 focus:ring-purple-200"
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 text-right font-urdu">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-urdu text-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>رجسٹر ہو رہا ہے...</span>
                </>
              ) : (
                "رجسٹر کریں"
              )}
            </button>
          </form>
          
          <p className="text-center mt-6 text-gray-600 font-urdu">
            پہلے سے اکاؤنٹ ہے؟{" "}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
              لاگ ان کریں
            </Link>
          </p>
        </div>
      </main>
      
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default Register;