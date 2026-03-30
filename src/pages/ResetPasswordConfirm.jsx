import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function ResetPasswordConfirm() {
  const [email, setEmail] = useState(localStorage.getItem("reset_email") || "");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleResetSubmit = async (e) => {
    e.preventDefault();

    // ✅ Frontend validation
    if (!email || !resetCode || !newPassword || !confirmPassword) {
      setError("ای میل، ری سیٹ کوڈ، نیا پاس ورڈ اور کنفرم پاس ورڈ لازمی ہیں");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("نیا پاس ورڈ اور کنفرم پاس ورڈ ایک جیسے ہونے چاہئیں");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/auth/reset-password-confirm", {
        email,
        reset_code: resetCode,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      setMessage(res.data["پیغام"]);
      localStorage.removeItem("reset_email");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map(d => `${d.loc.join(".")}: ${d.msg}`).join(", "));
      } else {
        setError("خرابی ہوئی، دوبارہ کوشش کریں");
      }
    }
  };

  return (
    <div className="form-container">
      <h2>نیا پاس ورڈ درج کریں</h2>
      {error && <p className="error">{error}</p>}
      {message && <p>{message}</p>}
      <form onSubmit={handleResetSubmit}>
        <input
          type="email"
          placeholder="ای میل درج کریں"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
        />
        <input
          type="text"
          placeholder="ری سیٹ کوڈ درج کریں"
          value={resetCode}
          onChange={(e) => setResetCode(e.target.value)}
          autoComplete="off"
        />
        <input
          type="password"
          placeholder="نیا پاس ورڈ درج کریں"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
        <input
          type="password"
          placeholder="کنفرم پاس ورڈ درج کریں"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        <button type="submit">پاس ورڈ تبدیل کریں</button>
      </form>
    </div>
  );
}

export default ResetPasswordConfirm;
