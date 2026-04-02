import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function ResetPasswordConfirm() {
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const API = import.meta.env.VITE_API_URL;

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
    // Allow alphanumeric, hyphens, underscores, and other common characters
    // This will accept codes like "VBUGIMS-982466", "ABC123", "RESET-CODE-123", etc.
    if (resetCode.length < 4) {
      setError("ری سیٹ کوڈ کم از کم 4 حروف کا ہونا چاہیے");
      return false;
    }
    if (resetCode.length > 50) {
      setError("ری سیٹ کوڈ زیادہ سے زیادہ 50 حروف کا ہو سکتا ہے");
      return false;
    }
    // Allow letters (both cases), numbers, hyphens, underscores, and periods
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

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    
    // Validate all fields
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
      
      // Clear stored email
      localStorage.removeItem("reset_email");
      
      // Navigate to login after 2 seconds
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6 font-urdu">
          نیا پاس ورڈ درج کریں
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right">
            ❌ {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right animate-pulse">
            {successMessage}
            <p className="text-sm mt-1">لاگ ان پیج پر جا رہے ہیں...</p>
          </div>
        )}

        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-urdu mb-2 text-right">
              ای میل
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              readOnly={localStorage.getItem("reset_email")}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-urdu mb-2 text-right">
              ری سیٹ کوڈ
            </label>
            <input
              type="text"
              placeholder="ری سیٹ کوڈ درج کریں (مثال: VBUGIMS-982466)"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              براہ کرم اپنی ای میل میں بھیجا گیا ری سیٹ کوڈ درج کریں
            </p>
            <p className="text-xs text-purple-600 mt-1 text-right">
              💡 کوڈ میں حروف، اعداد، ہائفن (-)، انڈر اسکور (_) اور ڈاٹ (.) استعمال ہو سکتے ہیں
            </p>
          </div>
          
          <div>
            <label className="block text-gray-700 font-urdu mb-2 text-right">
              نیا پاس ورڈ
            </label>
            <input
              type="password"
              placeholder="نیا پاس ورڈ درج کریں"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
            {newPassword && (
              <div className="text-xs text-gray-500 mt-2 text-right space-y-1">
                <p>پاس ورڈ میں یہ خصوصیات ہونی چاہئیں:</p>
                <ul className="list-disc list-inside pr-4">
                  <li className={newPassword.length >= 8 ? "text-green-600" : ""}>✓ کم از کم 8 حروف</li>
                  <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>✓ کم از کم ایک بڑا حرف (A-Z)</li>
                  <li className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>✓ کم از کم ایک چھوٹا حرف (a-z)</li>
                  <li className={/[0-9]/.test(newPassword) ? "text-green-600" : ""}>✓ کم از کم ایک عدد (0-9)</li>
                  <li className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "text-green-600" : ""}>✓ کم از کم ایک سپیشل کریکٹر</li>
                </ul>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-gray-700 font-urdu mb-2 text-right">
              کنفرم پاس ورڈ
            </label>
            <input
              type="password"
              placeholder="پاس ورڈ دوبارہ درج کریں"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1 text-right">
                ✗ پاس ورڈز ایک جیسے نہیں ہیں
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-green-600 text-xs mt-1 text-right">
                ✓ پاس ورڈز ایک جیسے ہیں
              </p>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-urdu text-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>پاس ورڈ تبدیل ہو رہا ہے...</span>
              </>
            ) : (
              "پاس ورڈ تبدیل کریں"
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <div>
            <Link to="/forgot-password" className="text-purple-600 hover:text-purple-700 font-urdu">
              ← نیا کوڈ حاصل کریں
            </Link>
          </div>
          <div>
            <Link to="/login" className="text-gray-600 hover:text-purple-600 font-urdu">
              واپس لاگ ان پر جائیں
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordConfirm;