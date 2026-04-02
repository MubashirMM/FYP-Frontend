import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    setForm({ username: "", password: "" });
    setError("");
    setSuccessMessage("");
  }, []);

  const validateForm = () => {
    if (!form.username.trim()) {
      setError("ای میل درج کریں");
      return false;
    }
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
          password: form.password,
        })
      );
      
      localStorage.setItem("token", res.data.access_token);
      setSuccessMessage("✅ لاگ ان کامیاب! مین پیج پر جا رہے ہیں...");
      
      setTimeout(() => {
        navigate("/main");
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || "لاگ ان میں خرابی: یوزر نیم یا پاس ورڈ غلط ہے");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6 font-urdu">
          لاگ ان کریں
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right">
            ❌ {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right animate-pulse">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          {/* Hidden fields to trick browser autofill */}
          <input type="text" name="prevent_autofill" className="hidden" tabIndex="-1" />
          
          <div>
            <label className="block text-gray-700 font-urdu mb-2 text-right">
              ای میل
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              placeholder="example@email.com" 
              value={form.username}
              autoComplete="off"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-urdu mb-2 text-right">
              پاس ورڈ
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              placeholder="پاس ورڈ درج کریں"
              value={form.password}
              autoComplete="new-password" 
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-urdu text-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        <div className="mt-6 space-y-2 text-center">
          <p>
            <Link to="/forgot-password" className="text-purple-600 hover:text-purple-700 font-urdu">
              پاس ورڈ بھول گئے؟
            </Link>
          </p>
          <p>
            <Link to="/voice-login" className="text-purple-600 hover:text-purple-700 font-urdu">
              🎤 وائس لاگ ان استعمال کریں
            </Link>
          </p>
          <p className="mt-4 text-gray-600 font-urdu">
            اکاؤنٹ نہیں ہے؟{" "}
            <Link to="/register" className="text-purple-600 hover:text-purple-700 font-semibold">
              رجسٹر کریں
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;