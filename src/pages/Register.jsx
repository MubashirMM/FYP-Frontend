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
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Force clear form fields on refresh to prevent ghost data
  useEffect(() => {
    setForm({ email: "", username: "", password: "", confirmPassword: "" });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.username || !form.password || !form.confirmPassword) {
      setError("تمام فیلڈز لازمی ہیں");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("پاس ورڈ اور کنفرم پاس ورڈ ایک جیسے ہونے چاہئیں");
      return;
    }
    try {
      const res = await axios.post("http://localhost:8000/auth/register", {
        email: form.email,
        username: form.username,
        password: form.password,
        voice_samples: [] 
      });
      alert(res.data.detail);
      // Pass email to voice register page
      navigate("/voice-samples-form", { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.detail || "رجسٹریشن میں خرابی");
    }
  };

  return (
    <div className="form-container">
      <h2>اکاؤنٹ بنائیں</h2>
      {error && <p className="error">{error}</p>}
      
      <form onSubmit={handleSubmit} autoComplete="off">
        {/* Hidden Dummy Fields to catch the browser's "helpful" autofill */}
        <input type="text" name="prevent_autofill" style={{ display: "none" }} tabIndex="-1" />
        <input type="password" name="password_fake" style={{ display: "none" }} tabIndex="-1" />

        <input 
          type="email" 
          name="reg_email_field"
          placeholder="ای میل درج کریں" 
          value={form.email} 
          autoComplete="one-time-code"
          onChange={e => setForm({...form, email: e.target.value})} 
        />

        <input 
          type="text" 
          name="reg_user_field"
          placeholder="یوزر نیم درج کریں" 
          value={form.username} 
          autoComplete="one-time-code"
          onChange={e => setForm({...form, username: e.target.value})} 
        />

        <input 
          type="password" 
          name="reg_pass_field"
          placeholder="پاس ورڈ درج کریں" 
          value={form.password} 
          autoComplete="new-password"
          onChange={e => setForm({...form, password: e.target.value})} 
        />

        <input 
          type="password" 
          name="reg_confirm_pass_field"
          placeholder="پاس ورڈ دوبارہ درج کریں۔"
          value={form.confirmPassword} 
          autoComplete="new-password"
          onChange={e => setForm({...form, confirmPassword: e.target.value})} 
        />

        <button type="submit">رجسٹر کریں</button>
      </form>
      
      <p>پہلے سے اکاؤنٹ ہے؟ <Link to="/login">لاگ ان کریں</Link></p>
    </div>
  );
}

export default Register;