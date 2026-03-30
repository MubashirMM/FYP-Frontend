import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/auth/forgot-password", null, {
        params: { email }
      });
      setMessage(res.data["پیغام"]);
      // ✅ Save email in localStorage so ResetPasswordConfirm can use it
      localStorage.setItem("reset_email", email);
      // Navigate to reset page
      navigate("/reset-password-confirm");
    } catch (err) {
      setError(err.response?.data?.detail || "ای میل درست نہیں ہے");
    }
  };

  return (
    <div className="form-container">
      <h2>پاس ورڈ ری سیٹ کریں</h2>
      {error && <p className="error">{error}</p>}
      {message && <p>{message}</p>}
      <form onSubmit={handleEmailSubmit}>
        <input
          type="email"
          placeholder="اپنا ای میل درج کریں"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
        />
        <button type="submit">ری سیٹ کوڈ بھیجیں</button>
      </form>
    </div>
  );
}

export default ForgotPassword;
