import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setForm({ username: "", password: "" });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("یوزر نیم اور پاس ورڈ لازمی ہیں");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:8000/auth/login",
        new URLSearchParams({
          username: form.username,
          password: form.password,
        })
      );
      
      localStorage.setItem("token", res.data.access_token);
      navigate("/main");
    } catch (err) {
      setError(err.response?.data?.detail || "لاگ ان میں خرابی: یوزر نیم یا پاس ورڈ غلط ہے");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container" dir="rtl">
      <h2 className="text-2xl font-bold mb-4">لاگ ان کریں</h2>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} autoComplete="off">
        {/* Hidden fields to trick browser autofill */}
        <input type="text" name="prevent_autofill" style={{ display: "none" }} tabIndex="-1" />
        
        <div className="mb-4">
          <input
            type="email"
            className="w-full p-3 border rounded"
            placeholder="ای میل درج کریں" 
            value={form.username}
            autoComplete="off"
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>
        
        <div className="mb-4">
          <input
            type="password"
            className="w-full p-3 border rounded"
            placeholder="پاس ورڈ درج کریں"
            value={form.password}
            autoComplete="new-password" 
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-3 rounded text-white font-bold ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? "انتظار کریں..." : "لاگ ان کریں"}
        </button>
      </form>

      <div className="links mt-6 space-y-2">
        <p><Link to="/forgot-password">پاس ورڈ بھول گئے؟</Link></p>
        <p><Link to="/voice-login">وائس لاگ ان (Voice Login) استعمال کریں</Link></p>
      </div>
    </div>
  );
}

export default Login;