
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function Profile() {
  const [user, setUser] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ text: "", type: "" });

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, getAuthHeader());
      setUser(res.data);

      setForm({
        username: res.data.username,
        email: res.data.email,
        password: "",
        confirmPassword: ""
      });

    } catch (err) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("پاس ورڈ میں کم از کم ایک بڑا حرف (A-Z) ہونا چاہیے");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("پاس ورڈ میں کم از کم ایک چھوٹا حرف (a-z) ہونا چاہیے");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("پاس ورڈ میں کم از کم ایک عدد (0-9) ہونا چاہیے");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("پاس ورڈ میں کم از کم ایک خاص حرف (!@#$%^&* etc) ہونا چاہیے");
    }
    return errors;
  };

  // ============================
  // UPDATE
  // ============================
  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrors({});
    setUpdateMessage({ text: "", type: "" });

    if (!form.username.trim()) {
      setErrors({ ...errors, username: "نام درج کریں" });
      return;
    }
    if (!form.email.trim()) {
      setErrors({ ...errors, email: "ای میل درج کریں" });
      return;
    }

    if (form.password) {
      const passwordErrors = validatePassword(form.password);
      if (passwordErrors.length > 0) {
        setErrors({ password: passwordErrors });
        return;
      }

      if (form.password !== form.confirmPassword) {
        setErrors({ confirmPassword: "پاس ورڈز مماثل نہیں ہیں" });
        return;
      }
    }

    setUpdateLoading(true);

    try {
      const updateData = {
        username: form.username,
        email: form.email,
      };
      
      if (form.password) {
        updateData.password = form.password;
      }

      await axios.patch(`${API}/auth/profile`, updateData, getAuthHeader());
      
      setUpdateMessage({ text: "پروفائل کامیابی سے اپڈیٹ ہو گیا", type: "success" });
      
      setTimeout(() => {
        setShowUpdate(false);
        fetchUser();
        setUpdateMessage({ text: "", type: "" });
      }, 1500);
      
    } catch (err) {
      setUpdateMessage({ 
        text: err.response?.data?.detail || "اپڈیٹ کرنے میں خرابی", 
        type: "error" 
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  // ============================
  // DELETE
  // ============================
  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") {
      setDeleteError("براہ کرم تصدیق کے لیے 'DELETE' لکھیں");
      return;
    }

    setDeleteError("");
    setDeleteLoading(true);

    try {
      await axios.delete(`${API}/auth/profile`, getAuthHeader());
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      setDeleteError("حذف کرنے میں مسئلہ پیش آیا");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) return <div className="text-center py-20">لوڈ ہو رہا ہے...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        
        {/* Voice Register Button - Added at top of profile */}
        <div className="mb-6 flex justify-end">
          <Link
            to="/voice-samples-form"
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm font-urdu shadow-md hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2"
          >
            <span>🎙️</span> وائس رجسٹر کریں
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-transparent">
          
          {/* Profile Info */}
          <div className="space-y-6">
            
            {/* Profile Number */}
            <div className="pb-4">
              <p className="text-gray-500 text-sm mb-1 font-urdu">پروفائل نمبر</p>
              <p className="text-2xl font-bold text-gray-800">#{user.user_id}</p>
              <hr className="mt-4 border-gray-200" />
            </div>

            {/* Name */}
            <div className="pb-4">
              <p className="text-gray-500 text-sm mb-1 font-urdu">نام</p>
              <p className="text-xl font-semibold text-gray-800">{user.username}</p>
              <hr className="mt-4 border-gray-200" />
            </div>

            {/* Email */}
            <div className="pb-4">
              <p className="text-gray-500 text-sm mb-1 font-urdu">ای میل</p>
              <p className="text-xl font-semibold text-gray-800">{user.email}</p>
              <hr className="mt-4 border-gray-200" />
            </div>

            {/* Account Creation Date */}
            <div className="pb-4">
              <p className="text-gray-500 text-sm mb-1 font-urdu">اکاؤنٹ بنایا گیا</p>
              <p className="text-lg font-semibold text-gray-800">{user.created_at}</p>
              <hr className="mt-4 border-gray-200" />
            </div>

          </div>

          {/* Buttons */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={() => setShowUpdate(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md font-urdu"
            >
              ✏️ اپڈیٹ کریں
            </button>

            <button
              onClick={() => setShowDelete(true)}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md font-urdu"
            >
              🗑️ اکاؤنٹ حذف کریں
            </button>
          </div>
        </div>
      </div>

      {/* ========================= */}
      {/* UPDATE MODAL */}
      {/* ========================= */}
      {showUpdate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md mx-auto my-auto p-6 shadow-2xl">
            
            <h2 className="text-2xl font-bold mb-6 text-center font-urdu">پروفائل اپڈیٹ</h2>

            {updateMessage.text && (
              <div className={`mb-4 p-3 rounded-xl text-center ${updateMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} font-urdu`}>
                {updateMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">

              <div>
                <input
                  value={form.username}
                  onChange={(e) => setForm({...form, username: e.target.value})}
                  className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 font-urdu ${errors.username ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="نام"
                />
                {errors.username && <p className="text-red-500 text-sm mt-1 font-urdu">{errors.username}</p>}
              </div>

              <div>
                <input
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 font-urdu ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="ای میل"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1 font-urdu">{errors.email}</p>}
              </div>

              <div>
                <input
                  type="password"
                  placeholder="نیا پاس ورڈ (اختیاری)"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-urdu"
                />
              </div>

              {form.password && (
                <div>
                  <input
                    type="password"
                    placeholder="پاس ورڈ دوبارہ"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                    className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 font-urdu ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1 font-urdu">{errors.confirmPassword}</p>}
                </div>
              )}

              {form.password && (
                <div className="bg-gray-50 p-3 rounded-xl text-sm">
                  <p className="font-bold mb-2 font-urdu">پاس ورڈ کی شرائط:</p>
                  <ul className="space-y-1 text-gray-600 font-urdu">
                    <li className={form.password.length >= 8 ? "text-green-600" : ""}>✓ کم از کم 8 حروف</li>
                    <li className={/[A-Z]/.test(form.password) ? "text-green-600" : ""}>✓ ایک بڑا حرف (A-Z)</li>
                    <li className={/[a-z]/.test(form.password) ? "text-green-600" : ""}>✓ ایک چھوٹا حرف (a-z)</li>
                    <li className={/[0-9]/.test(form.password) ? "text-green-600" : ""}>✓ ایک عدد (0-9)</li>
                    <li className={/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? "text-green-600" : ""}>✓ ایک خاص حرف (!@#$%^&*)</li>
                  </ul>
                </div>
              )}

              {errors.password && Array.isArray(errors.password) && (
                <div className="bg-red-50 p-3 rounded-xl">
                  {errors.password.map((err, idx) => (
                    <p key={idx} className="text-red-600 text-sm font-urdu">{err}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button type="submit" disabled={updateLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold disabled:opacity-50 transition-all font-urdu">
                  {updateLoading ? "محفوظ ہو رہا ہے..." : "💾 محفوظ کریں"}
                </button>
                <button type="button" onClick={() => { setShowUpdate(false); setErrors({}); setUpdateMessage({ text: "", type: "" }); setForm({ username: user.username, email: user.email, password: "", confirmPassword: "" }); }} className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-xl font-bold transition-all font-urdu">
                  ❌ واپس
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* DELETE MODAL */}
      {/* ========================= */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full mx-auto my-auto p-6 shadow-2xl">

            <h2 className="text-2xl font-bold text-red-600 mb-4 text-center font-urdu">
              ⚠️ اکاؤنٹ حذف کریں
            </h2>

            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-6 text-sm text-red-700">
              <p className="font-bold mb-2 font-urdu">⚠️ انتباہ!</p>
              <p className="font-urdu">یہ عمل واپس نہیں کیا جا سکتا۔</p>
              <p className="font-urdu">آپ کا تمام ڈیٹا مستقل طور پر حذف ہو جائے گا:</p>
              <ul className="list-disc pr-5 mt-2 space-y-1 font-urdu">
                <li>بلز</li>
                <li>اُدھار</li>
                <li>آئٹمز</li>
                <li>کھاتہ</li>
                <li>رپورٹس</li>
              </ul>
            </div>

            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="تصدیق کے لیے DELETE لکھیں"
              className="w-full p-3 border-2 border-red-300 rounded-xl text-center font-mono mb-3 focus:outline-none focus:border-red-500"
            />

            {deleteError && (
              <p className="text-red-600 text-sm text-center mb-3 font-urdu">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); setDeleteError(""); }} className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold transition-all font-urdu">
                واپس
              </button>
              <button onClick={handleDelete} disabled={deleteConfirm !== "DELETE" || deleteLoading} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all font-urdu">
                {deleteLoading ? "حذف ہو رہا ہے..." : "🗑️ حذف کریں"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Profile;