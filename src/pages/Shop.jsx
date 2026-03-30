import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function Shop() {
  const [shop, setShop] = useState(null);
  const [formData, setFormData] = useState({
    shop_name: "",
    address: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    shop_name: "",
    address: ""
  });
  const [updateErrors, setUpdateErrors] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ text: "", type: "" });

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Fetch existing shop
  const fetchShop = async () => {
    try {
      const res = await axios.get(`${API}/shops`, getAuthHeader());
      if (res.data && res.data.length > 0) {
        const existingShop = res.data[0];
        setShop(existingShop);
        setFormData({
          shop_name: existingShop.shop_name || "",
          address: existingShop.address || ""
        });
        setUpdateForm({
          shop_name: existingShop.shop_name || "",
          address: existingShop.address || ""
        });
        setIsEditing(true);
      } else {
        setShop(null);
        setIsEditing(false);
        setFormData({ shop_name: "", address: "" });
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  // Form Validation for Update
  const validateUpdateForm = () => {
    let newErrors = {};
    if (!updateForm.shop_name || !updateForm.shop_name.trim()) {
      newErrors.shop_name = "دکان کا نام درج کرنا ضروری ہے۔";
    } else if (updateForm.shop_name.trim().length < 3) {
      newErrors.shop_name = "دکان کا نام کم از کم 3 حروف کا ہونا چاہیے۔";
    }

    if (!updateForm.address || !updateForm.address.trim()) {
      newErrors.address = "دکان کا پتہ درج کرنا ضروری ہے۔";
    }

    setUpdateErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Shop (Create)
  const saveShop = async (e) => {
    e.preventDefault();
    
    let newErrors = {};
    if (!formData.shop_name || !formData.shop_name.trim()) {
      newErrors.shop_name = "دکان کا نام درج کرنا ضروری ہے۔";
    } else if (formData.shop_name.trim().length < 3) {
      newErrors.shop_name = "دکان کا نام کم از کم 3 حروف کا ہونا چاہیے۔";
    }
    if (!formData.address || !formData.address.trim()) {
      newErrors.address = "دکان کا پتہ درج کرنا ضروری ہے۔";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await axios.post(`${API}/shops`, formData, getAuthHeader());
      setMessage({ text: "اسٹور کامیابی سے بن گیا", type: "success" });
      await fetchShop();
      setFormData({ shop_name: "", address: "" });
    } catch (err) {
      const msg = err.response?.data?.detail || "محفوظ کرنے میں ناکامی ہوئی";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  // Update Shop
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateUpdateForm()) return;

    setUpdateLoading(true);
    setUpdateMessage({ text: "", type: "" });

    try {
      await axios.patch(`${API}/shops/${shop.shop_id}`, {
        shop_name: updateForm.shop_name,
        address: updateForm.address
      }, getAuthHeader());
      
      setUpdateMessage({ text: "اسٹور کی تفصیلات کامیابی سے اپ ڈیٹ ہو گئیں", type: "success" });
      
      setTimeout(() => {
        setShowUpdateModal(false);
        fetchShop();
        setUpdateMessage({ text: "", type: "" });
        setUpdateErrors({});
      }, 1500);
      
    } catch (err) {
      setUpdateMessage({ 
        text: err.response?.data?.detail || "اپ ڈیٹ کرنے میں خرابی", 
        type: "error" 
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Delete Shop
  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") {
      setDeleteError("براہ کرم تصدیق کے لیے 'DELETE' لکھیں");
      return;
    }

    setDeleteError("");
    setDeleteLoading(true);

    try {
      await axios.delete(`${API}/shops/${shop.shop_id}`, getAuthHeader());
      setMessage({ text: "اسٹور کامیابی سے حذف ہو گیا", type: "success" });
      
      // Reset everything
      setShop(null);
      setIsEditing(false);
      setFormData({ shop_name: "", address: "" });
      setUpdateForm({ shop_name: "", address: "" });
      setShowDeleteModal(false);
      setDeleteConfirm("");
    } catch (err) {
      setDeleteError(err.response?.data?.detail || "حذف کرنے میں ناکامی");
    } finally {
      setDeleteLoading(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  if (initialLoading) {
    return <div className="text-center py-20">لوڈ ہو رہا ہے...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      {/* Toast Notification */}
      {message.text && (
        <div className={`fixed top-6 left-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl ${
          message.type === "success" ? "bg-green-600" : "bg-red-600"
        } text-white`}>
          {message.text}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        
        {/* Shop Card */}
        <div className="bg-transparent">
          
          {/* Shop Info - Only show if shop exists */}
          {isEditing && shop && (
            <div className="space-y-6 mb-8">
              
              {/* Shop Number */}
              <div className="pb-4">
                <p className="text-gray-500 text-sm mb-1">اسٹور نمبر</p>
                <p className="text-2xl font-bold text-gray-800">#{shop.shop_id}</p>
                <hr className="mt-4 border-gray-200" />
              </div>

              {/* Shop Name */}
              <div className="pb-4">
                <p className="text-gray-500 text-sm mb-1">اسٹور کا نام</p>
                <p className="text-xl font-semibold text-gray-800">{shop.shop_name}</p>
                <hr className="mt-4 border-gray-200" />
              </div>

              {/* Shop Address */}
              <div className="pb-4">
                <p className="text-gray-500 text-sm mb-1">اسٹور کا پتہ</p>
                <p className="text-lg font-semibold text-gray-800">{shop.address}</p>
                <hr className="mt-4 border-gray-200" />
              </div>

              {/* Warning Message - Like in Bills/Other pages */}
              {/* <div className="bg-blue-50 p-6 rounded-2xl mt-4 border border-blue-100">
                <p className="text-lg font-bold text-blue-800">⚠️ نوٹ:</p>
                <p className="text-blue-700 mt-2 text-sm">
                  اسٹور کا نام اور پتہ تمام بلز اور اُدھار پر ظاہر ہوتا ہے۔
                </p>
              </div> */}

            </div>
          )}

          {/* Form Section - Only for creating new shop when no shop exists */}
          {!isEditing && (
            <div className="mt-8">
              <div className="bg-green-50 p-6 rounded-2xl mb-6 border border-green-100">
                <p className="text-lg font-bold text-green-800">✅ اسٹور رجسٹر کریں</p>
                <p className="text-green-700 mt-2 text-sm">
                  براہ کرم اپنے اسٹور کی تفصیلات درج کریں۔ یہ معلومات تمام بلز پر ظاہر ہوں گی۔
                </p>
              </div>

              <form onSubmit={saveShop} className="space-y-6">
                {/* Shop Name Input */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">دکان / اسٹور کا نام</label>
                  <input
                    type="text"
                    value={formData.shop_name}
                    onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                    className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-all ${
                      errors.shop_name ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="مثلاً: احمد جنرل اسٹور"
                  />
                  {errors.shop_name && <p className="text-red-600 text-sm mt-1">{errors.shop_name}</p>}
                </div>

                {/* Shop Address Input */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">دکان کا پتہ</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows="3"
                    className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 resize-y transition-all ${
                      errors.address ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="مکمل پتہ درج کریں (مثلاً: دکان نمبر ۴، مین روڈ، کراچی)"
                  />
                  {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
                </div>

                {/* Action Button - On Right Side */}
                <div className="flex justify-end gap-4 mt-8">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md"
                  >
                    {loading ? "انتظار کریں..." : "➕ اسٹور بنائیں"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Buttons for Existing Shop - On Right Side */}
          {isEditing && (
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowUpdateModal(true)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md"
              >
                ✏️ اسٹور کی تفصیلات تبدیل کریں
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md"
              >
                🗑️ حذف کریں
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================= */}
      {/* UPDATE MODAL - Responsive */}
      {/* ========================= */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md mx-auto my-auto p-6 shadow-2xl">
            
            <h2 className="text-2xl font-bold mb-6 text-center">اسٹور کی تفصیلات تبدیل کریں</h2>

            {/* Success/Error Message */}
            {updateMessage.text && (
              <div className={`mb-4 p-3 rounded-xl text-center ${updateMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {updateMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">

              {/* Shop Name */}
              <div>
                <input
                  value={updateForm.shop_name}
                  onChange={(e) => setUpdateForm({...updateForm, shop_name: e.target.value})}
                  className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 ${updateErrors.shop_name ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="اسٹور کا نام"
                />
                {updateErrors.shop_name && <p className="text-red-500 text-sm mt-1">{updateErrors.shop_name}</p>}
              </div>

              {/* Shop Address */}
              <div>
                <textarea
                  value={updateForm.address}
                  onChange={(e) => setUpdateForm({...updateForm, address: e.target.value})}
                  rows="3"
                  className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 resize-y ${updateErrors.address ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="اسٹور کا پتہ"
                />
                {updateErrors.address && <p className="text-red-500 text-sm mt-1">{updateErrors.address}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold disabled:opacity-50 transition-all"
                >
                  {updateLoading ? "اپڈیٹ ہو رہا ہے..." : "💾 محفوظ کریں"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setUpdateErrors({});
                    setUpdateMessage({ text: "", type: "" });
                    setUpdateForm({
                      shop_name: shop?.shop_name || "",
                      address: shop?.address || ""
                    });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-xl font-bold transition-all"
                >
                  ❌ واپس
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* DELETE MODAL - Responsive */}
      {/* ========================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full mx-auto my-auto p-6 shadow-2xl">

            <h2 className="text-2xl font-bold text-red-600 mb-4 text-center">
              ⚠️ اسٹور حذف کریں
            </h2>

            {/* WARNING */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-6 text-sm text-red-700">
              <p className="font-bold mb-2">⚠️ انتباہ!</p>
              یہ عمل واپس نہیں کیا جا سکتا۔
              {/* <br />
              اسٹور کے تمام متعلقہ ڈیٹا مستقل طور پر حذف ہو جائے گا:
              <ul className="list-disc pr-5 mt-2 space-y-1">
                <li>بلز</li>
                <li>اُدھار</li>
                <li>آئٹمز</li>
                <li>کھاتہ</li>
                <li>رپورٹس</li>
              </ul> */}
              <p className="mt-2 font-bold">⚠️ اسٹور کا نام اور پتہ بلز اور اُدھار پر ظاہر ہوتا ہے۔ حذف کرنے سے بلز اور اُدھار میں یہ فیلڈز خالی دکھائی دیں گی۔</p>
              </div>

            {/* CONFIRM INPUT */}
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="تصدیق کے لیے DELETE لکھیں"
              className="w-full p-3 border-2 border-red-300 rounded-xl text-center font-mono mb-3 focus:outline-none focus:border-red-500"
            />

            {/* ERROR */}
            {deleteError && (
              <p className="text-red-600 text-sm text-center mb-3">
                {deleteError}
              </p>
            )}

            {/* BUTTONS */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                  setDeleteError("");
                }}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold transition-all"
              >
                واپس
              </button>

              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== "DELETE" || deleteLoading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all"
              >
                {deleteLoading ? "حذف ہو رہا ہے..." : "🗑️ حذف کریں"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Shop;