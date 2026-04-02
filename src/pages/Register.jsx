import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  
  const API = import.meta.env.VITE_API_URL;

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

  const validatePassword = (password) => {
    if (!password) return "پاس ورڈ درج کریں";
    if (password.length < 8) return "پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے";
    if (password.length > 30) return "پاس ورڈ زیادہ سے زیادہ 30 حروف کا ہو سکتا ہے";
    if (!/[A-Z]/.test(password)) return "پاس ورڈ میں کم از کم ایک بڑا حرف (A-Z) ہونا چاہیے";
    if (!/[a-z]/.test(password)) return "پاس ورڈ میں کم از کم ایک چھوٹا حرف (a-z) ہونا چاہیے";
    if (!/[0-9]/.test(password)) return "پاس ورڈ میں کم از کم ایک عدد (0-9) ہونا چاہیے";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "پاس ورڈ میں کم از کم ایک سپیشل کریکٹر (!@#$%^&* etc) ہونا چاہیے";
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
    // Clear success message when user starts typing again
    setSuccessMessage("");
    
    // Real-time validation
    let errorMsg = "";
    if (field === "email") errorMsg = validateEmail(value);
    else if (field === "username") errorMsg = validateUsername(value);
    else if (field === "password") {
      errorMsg = validatePassword(value);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setSuccessMessage("");
    setErrors({});
    
    // Validate all fields
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
    
    // Check if any errors exist
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
      
      // Show success message on form
      setSuccessMessage(res.data.detail || "اکاؤنٹ کامیابی سے بن گیا!");
      
      // Clear form fields
      setForm({ email: "", username: "", password: "", confirmPassword: "" });
      
      // Redirect after 2 seconds
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
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
          {/* Hidden Dummy Fields to catch browser autofill */}
          <input type="text" name="prevent_autofill" className="hidden" tabIndex="-1" />
          <input type="password" name="password_fake" className="hidden" tabIndex="-1" />

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
              <p className="text-red-500 text-sm mt-1 text-right">{errors.email}</p>
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
              <p className="text-red-500 text-sm mt-1 text-right">{errors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <input 
              type="password" 
              placeholder="پاس ورڈ درج کریں" 
              value={form.password} 
              autoComplete="new-password"
              onChange={e => handleFieldChange("password", e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg text-right font-urdu transition-all focus:outline-none focus:ring-2 ${
                errors.password 
                  ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                  : "border-gray-300 focus:border-purple-500 focus:ring-purple-200"
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 text-right">{errors.password}</p>
            )}
            <div className="text-xs text-gray-500 mt-2 text-right space-y-1">
              <p>پاس ورڈ میں یہ خصوصیات ہونی چاہئیں:</p>
              <ul className="list-disc list-inside pr-4">
                <li className={form.password.length >= 8 ? "text-green-600" : ""}>✓ کم از کم 8 حروف</li>
                <li className={/[A-Z]/.test(form.password) ? "text-green-600" : ""}>✓ کم از کم ایک بڑا حرف (A-Z)</li>
                <li className={/[a-z]/.test(form.password) ? "text-green-600" : ""}>✓ کم از کم ایک چھوٹا حرف (a-z)</li>
                <li className={/[0-9]/.test(form.password) ? "text-green-600" : ""}>✓ کم از کم ایک عدد (0-9)</li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? "text-green-600" : ""}>✓ کم از کم ایک سپیشل کریکٹر</li>
              </ul>
            </div>
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
              <p className="text-red-500 text-sm mt-1 text-right">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-urdu text-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </div>
  );
}

export default Register;