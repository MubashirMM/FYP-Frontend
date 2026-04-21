import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function ResetPasswordConfirm() {
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  
  const API = import.meta.env.VITE_API_URL;
  const isAuthenticated = !!localStorage.getItem("token");

  useEffect(() => {
    const savedEmail = localStorage.getItem("reset_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const validateEmail = () => {
    if (!email.trim()) {
      setError("ای میل درج کریں");
      return false;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("درست ای میل ایڈریس درج کریں");
      return false;
    }
    return true;
  };

  const validateResetCode = () => {
    if (!resetCode.trim()) {
      setError("ری سیٹ کوڈ درج کریں");
      return false;
    }
    if (resetCode.length < 4) {
      setError("ری سیٹ کوڈ کم از کم 4 حروف کا ہونا چاہیے");
      return false;
    }
    if (resetCode.length > 50) {
      setError("ری سیٹ کوڈ زیادہ سے زیادہ 50 حروف کا ہو سکتا ہے");
      return false;
    }
    if (!/^[a-zA-Z0-9\-_\.]+$/.test(resetCode)) {
      setError("ری سیٹ کوڈ صرف حروف، اعداد، ہائفن، انڈر اسکور اور ڈاٹ پر مشتمل ہو سکتا ہے");
      return false;
    }
    return true;
  };

  const validatePassword = (password) => {
    if (!password) return "نیا پاس ورڈ درج کریں";
    if (password.length < 8) return "پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے";
    if (password.length > 30) return "پاس ورڈ زیادہ سے زیادہ 30 حروف کا ہو سکتا ہے";
    if (!/[A-Z]/.test(password)) return "پاس ورڈ میں کم از کم ایک بڑا حرف (A-Z) ہونا چاہیے";
    if (!/[a-z]/.test(password)) return "پاس ورڈ میں کم از کم ایک چھوٹا حرف (a-z) ہونا چاہیے";
    if (!/[0-9]/.test(password)) return "پاس ورڈ میں کم از کم ایک عدد (0-9) ہونا چاہیے";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "پاس ورڈ میں کم از کم ایک سپیشل کریکٹر ہونا چاہیے";
    return "";
  };

  // Function to resend reset code
  const handleResendCode = async () => {
    if (!email.trim()) {
      setError("پہلے ای میل درج کریں");
      return;
    }
    
    if (!email.includes("@") || !email.includes(".")) {
      setError("درست ای میل ایڈریس درج کریں");
      return;
    }

    setIsResending(true);
    setResendMessage("");
    setError("");

    try {
      const res = await axios.post(`${API}/auth/forgot-password`, null, {
        params: { email }
      });
      
      setResendMessage(res.data["پیغام"] || "✅ نیا ری سیٹ کوڈ آپ کی ای میل پر بھیج دیا گیا ہے!");
      
      // Clear previous code from input
      setResetCode("");
      
      // Auto clear message after 3 seconds
      setTimeout(() => {
        setResendMessage("");
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.detail || "ای میل درست نہیں ہے یا رجسٹرڈ نہیں ہے");
    } finally {
      setIsResending(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setResendMessage("");
    
    if (!validateEmail()) return;
    if (!validateResetCode()) return;
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("نیا پاس ورڈ اور کنفرم پاس ورڈ ایک جیسے ہونے چاہئیں");
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(`${API}/auth/reset-password-confirm`, {
        email,
        reset_code: resetCode,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      setSuccessMessage(res.data["پیغام"] || "✅ پاس ورڈ کامیابی سے تبدیل ہو گیا!");
      
      localStorage.removeItem("reset_email");
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map(d => `${d.loc.join(".")}: ${d.msg}`).join(", "));
      } else {
        setError("خرابی ہوئی، دوبارہ کوشش کریں");
      }
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
      
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Reset Password Card */}
        <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-md">
          <h2 className="text-xl font-bold text-center text-gray-800 mb-3 font-urdu">
            نیا پاس ورڈ درج کریں
          </h2>
          
          {error && (
            <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right text-sm font-urdu">
              ❌ {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-3 p-2 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right animate-pulse text-sm font-urdu">
              ✅ {successMessage}
              <p className="text-xs mt-1">لاگ ان پیج پر جا رہے ہیں...</p>
            </div>
          )}

          {resendMessage && (
            <div className="mb-3 p-2 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right text-sm font-urdu">
              ✅ {resendMessage}
            </div>
          )}

          <form onSubmit={handleResetSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="اپنا ای میل درج کریں"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              readOnly={!!localStorage.getItem("reset_email")}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 text-sm"
            />
            
            <div className="relative">
              <input
                type="text"
                placeholder="ری سیٹ کوڈ درج کریں"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                autoComplete="off"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-left font-mono focus:outline-none focus:border-purple-500 text-sm"
                dir="ltr"
              />
            </div>
            
            <input
              type="password"
              placeholder="نیا پاس ورڈ درج کریں"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 text-sm"
            />
            
            <input
              type="password"
              placeholder="پاس ورڈ دوبارہ درج کریں"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 text-sm"
            />
            
            {/* Password strength indicator */}
            {newPassword && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className={`h-1 flex-1 rounded-full transition-all ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className={`h-1 flex-1 rounded-full transition-all ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className={`h-1 flex-1 rounded-full transition-all ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className={`h-1 flex-1 rounded-full transition-all ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-500 text-xs text-right font-urdu">✗ پاس ورڈز ایک جیسے نہیں ہیں</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-green-600 text-xs text-right font-urdu">✓ پاس ورڈز ایک جیسے ہیں</p>
                )}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-urdu text-base font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>پاس ورڈ تبدیل ہو رہا ہے...</span>
                </>
              ) : (
                "پاس ورڈ تبدیل کریں"
              )}
            </button>
          </form>
        </div>

        {/* Links Section - Outside the card */}
        <div className="mt-4 text-center space-y-2">
          <div>
            <button 
              onClick={handleResendCode}
              disabled={isResending}
              className="text-purple-600 hover:text-purple-700 font-urdu text-sm transition-all duration-200 hover:underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? "⏳ بھیجا جا رہا ہے..." : "← نیا کوڈ حاصل کریں"}
            </button>
          </div>
          <div>
            <Link to="/login" className="text-gray-500 hover:text-purple-600 font-urdu text-sm transition-all duration-200 hover:underline underline-offset-2">
              واپس لاگ ان پر جائیں
            </Link>
          </div>
        </div>
      </main>
      
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default ResetPasswordConfirm;