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
  const [deleteSuccess, setDeleteSuccess] = useState("");

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

      // Show success message
      setDeleteSuccess("اکاؤنٹ کامیابی سے حذف ہو گیا!");

      // Clear token and redirect after showing success message
      setTimeout(() => {
        localStorage.removeItem("token");
        navigate("/login");
      }, 2000);

    } catch (err) {
      setDeleteError(err.response?.data?.detail || "حذف کرنے میں مسئلہ پیش آیا");
      setDeleteLoading(false);
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-urdu">لوڈ ہو رہا ہے...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-2xl mx-auto">

        {/* Header with Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl transition-all font-urdu flex items-center gap-2"
          >
            ← واپس
          </button>
          <h1 className="text-2xl font-bold text-gray-800 font-urdu">میری پروفائل</h1>
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">

          {/* Profile Info */}
          <div className="space-y-6">

            {/* Profile Number with Icon */}
            <div className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🆔</span>
                <p className="text-gray-500 text-sm font-urdu">پروفائل نمبر</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">#{user.user_id}</p>
              <hr className="mt-4 border-gray-200" />
            </div>

            {/* Name */}
            <div className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👤</span>
                <p className="text-gray-500 text-sm font-urdu">نام</p>
              </div>
              <p className="text-xl font-semibold text-gray-800">{user.username}</p>
              <hr className="mt-4 border-gray-200" />
            </div>

            {/* Email */}
            <div className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📧</span>
                <p className="text-gray-500 text-sm font-urdu">ای میل</p>
              </div>
              <p className="text-xl font-semibold text-gray-800">{user.email}</p>
              <hr className="mt-4 border-gray-200" />
            </div>

            {/* Account Creation Date */}
            <div className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📅</span>
                <p className="text-gray-500 text-sm font-urdu">اکاؤنٹ بنایا گیا</p>
              </div>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(user.created_at).toLocaleDateString('ur-PK')}
              </p>
              <hr className="mt-4 border-gray-200" />
            </div>

          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4">
            <button
              onClick={() => setShowUpdate(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md font-urdu flex items-center justify-center gap-2"
            >
              <span>✏️</span>
              <span>اپڈیٹ کریں</span>
            </button>

            <button
              onClick={() => setShowDelete(true)}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md font-urdu flex items-center justify-center gap-2"
            >
              <span>🗑️</span>
              <span>اکاؤنٹ حذف کریں</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================= */}
      {/* UPDATE MODAL */}
      {/* ========================= */}
      {showUpdate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md mx-auto my-auto p-6 shadow-2xl animate-fadeIn">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-urdu">پروفائل اپڈیٹ</h2>
              <button
                onClick={() => {
                  setShowUpdate(false);
                  setErrors({});
                  setUpdateMessage({ text: "", type: "" });
                  setForm({ username: user.username, email: user.email, password: "", confirmPassword: "" });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {updateMessage.text && (
              <div className={`mb-4 p-3 rounded-xl text-center font-urdu ${updateMessage.type === 'success'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                {updateMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">

              <div>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 font-urdu transition-all ${errors.username ? 'border-red-500' : 'border-gray-200'
                    }`}
                  placeholder="نام"
                />
                {errors.username && <p className="text-red-500 text-sm mt-1 font-urdu">{errors.username}</p>}
              </div>

              <div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 font-urdu transition-all ${errors.email ? 'border-red-500' : 'border-gray-200'
                    }`}
                  placeholder="ای میل"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1 font-urdu">{errors.email}</p>}
              </div>

              <div>
                <input
                  type="password"
                  placeholder="نیا پاس ورڈ (اختیاری)"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-urdu transition-all"
                />
              </div>

              {form.password && (
                <div>
                  <input
                    type="password"
                    placeholder="پاس ورڈ دوبارہ"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 font-urdu transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                      }`}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1 font-urdu">{errors.confirmPassword}</p>}
                </div>
              )}

              {form.password && (
                <div className="bg-gray-50 p-3 rounded-xl text-sm">
                  <p className="font-bold mb-2 font-urdu text-gray-700">پاس ورڈ کی شرائط:</p>
                  <ul className="space-y-1 text-gray-600 font-urdu">
                    <li className={form.password.length >= 8 ? "text-green-600" : "text-gray-500"}>
                      {form.password.length >= 8 ? "✓" : "○"} کم از کم 8 حروف
                    </li>
                    <li className={/[A-Z]/.test(form.password) ? "text-green-600" : "text-gray-500"}>
                      {/[A-Z]/.test(form.password) ? "✓" : "○"} ایک بڑا حرف (A-Z)
                    </li>
                    <li className={/[a-z]/.test(form.password) ? "text-green-600" : "text-gray-500"}>
                      {/[a-z]/.test(form.password) ? "✓" : "○"} ایک چھوٹا حرف (a-z)
                    </li>
                    <li className={/[0-9]/.test(form.password) ? "text-green-600" : "text-gray-500"}>
                      {/[0-9]/.test(form.password) ? "✓" : "○"} ایک عدد (0-9)
                    </li>
                    <li className={/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? "text-green-600" : "text-gray-500"}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? "✓" : "○"} ایک خاص حرف (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              )}

              {errors.password && Array.isArray(errors.password) && (
                <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                  {errors.password.map((err, idx) => (
                    <p key={idx} className="text-red-600 text-sm font-urdu">⚠️ {err}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold disabled:opacity-50 transition-all font-urdu"
                >
                  {updateLoading ? "محفوظ ہو رہا ہے..." : "💾 محفوظ کریں"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdate(false);
                    setErrors({});
                    setUpdateMessage({ text: "", type: "" });
                    setForm({ username: user.username, email: user.email, password: "", confirmPassword: "" });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-xl font-bold transition-all font-urdu"
                >
                  ❌ منسوخ کریں
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
          <div className="bg-white rounded-3xl max-w-md w-full mx-auto my-auto p-6 shadow-2xl animate-fadeIn">

            {deleteSuccess ? (
              // Success View
              <div className="text-center py-8 animate-fadeIn">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✓</span>
                </div>
                <h3 className="text-2xl font-bold text-green-600 mb-2 font-urdu">کامیاب!</h3>
                <p className="text-gray-700 font-urdu text-lg">{deleteSuccess}</p>
                <p className="text-gray-500 text-sm mt-4 font-urdu">لاگ ان پیج پر ری ڈائریکٹ ہو رہا ہے...</p>
                <div className="mt-6 w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              // Delete Confirmation View
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-red-600 font-urdu">
                    ⚠️ اکاؤنٹ حذف کریں
                  </h2>
                  <button
                    onClick={() => {
                      setShowDelete(false);
                      setDeleteConfirm("");
                      setDeleteError("");
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-6 text-sm text-red-700">
                  <p className="font-bold mb-2 font-urdu flex items-center gap-2">
                    <span>⚠️</span>
                    <span>انتباہ!</span>
                  </p>
                  <p className="font-urdu">یہ عمل واپس نہیں کیا جا سکتا۔</p>
                  <p className="font-urdu mt-1">آپ کا تمام ڈیٹا مستقل طور پر حذف ہو جائے گا:</p>
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
                  className="w-full p-3 border-2 border-red-300 rounded-xl text-center font-mono mb-3 focus:outline-none focus:border-red-500 transition-all"
                  autoFocus
                />

                {deleteError && (
                  <p className="text-red-600 text-sm text-center mb-3 font-urdu bg-red-50 p-2 rounded-lg">
                    ⚠️ {deleteError}
                  </p>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowDelete(false);
                      setDeleteConfirm("");
                      setDeleteError("");
                    }}
                    className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold transition-all font-urdu"
                  >
                    ❌ واپس
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirm !== "DELETE" || deleteLoading}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all font-urdu"
                  >
                    {deleteLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        <span>حذف ہو رہا ہے...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>🗑️</span>
                        <span>حذف کریں</span>
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Profile;