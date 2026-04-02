import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const ALLOWED_UNITS = [
  "کلو", "گرام", "پاؤ", "چھٹانک", "سیر", "من", "بوری",
  "لیٹر", "ملی لیٹر", "عدد", "درجن", "آدھا درجن",
  "پیکٹ", "ڈبہ", "بوتل"
];

function BillItems({ onItemAdded, onClose }) {
  const [billItems, setBillItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [deleteId, setDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const fetchBillItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/bill-items/`, getAuthHeader());
      const data = Array.isArray(res.data) ? res.data : [];
      setBillItems(data);
      setFilteredItems(data);
      setCurrentPage(1);
    } catch (err) {
      if (err.response?.status !== 404) {
        showMsg(err.response?.data?.detail || "بل آئٹمز لوڈ کرنے میں خرابی", "error");
      }
      setBillItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredItems(billItems);
    } else {
      const filtered = billItems.filter(item => 
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
    setCurrentPage(1);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/bill-items/${deleteId}`, getAuthHeader());
      showMsg("✅ بل آئٹم کامیابی سے حذف کر دیا گیا", "success");
      setDeleteId(null);
      fetchBillItems();
      if (onItemAdded) onItemAdded();
    } catch (err) {
      showMsg(err.response?.data?.detail || "حذف کرنے میں خرابی", "error");
    }
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleAddNew = () => {
    setShowForm(true);
  };

  const handleFormClose = (shouldRefresh = false) => {
    setShowForm(false);
    if (shouldRefresh) {
      fetchBillItems();
      if (onItemAdded) onItemAdded();
    }
  };

  useEffect(() => {
    fetchBillItems();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="relative">
      {/* Message Toast */}
      {message.text && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl animate-slide-down text-sm md:text-base transition-all duration-300"
          style={{
            backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <span className="text-lg">✅</span> : <span className="text-lg">❌</span>}
            <span className="font-urdu">{message.text}</span>
          </div>
        </div>
      )}

      {!showForm ? (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-urdu">🧾 بل آئٹمز</h2>
                <p className="text-gray-500 text-sm mt-1">کل بل آئٹمز: {filteredItems.length}</p>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="🔍 آئٹم نام سے تلاش کریں..." 
                    value={search} 
                    onChange={handleSearchChange}
                    className="w-full md:w-80 p-3 pr-10 border-2 border-gray-200 rounded-xl bg-white focus:border-indigo-500 focus:outline-none transition-all text-sm font-urdu"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                </div>
                <button 
                  onClick={handleAddNew} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"
                >
                  <span>+</span> نیا بل آئٹم
                </button>
                <button 
                  onClick={onClose} 
                  className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all"
                >
                  ✕ بند کریں
                </button>
              </div>
            </div>
          </div>

          {/* Updated Table with Urdu Columns */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-right min-w-[1200px]">
              <thead className="bg-gray-100 border-b sticky top-0">
                <tr>
                  <th className="p-4 border-l font-bold text-gray-700 text-base">آئٹم نام</th>
                  <th className="p-4 border-l font-bold text-gray-700 text-center text-base">مقدار (درخواست شدہ اکائی)</th>
                  <th className="p-4 border-l font-bold text-gray-700 text-center text-base">بنیادی اکائی</th>
                  <th className="p-4 border-l font-bold text-gray-700 text-center text-base">درخواست شدہ اکائی</th>
                  <th className="p-4 border-l font-bold text-gray-700 text-center text-base">فی بنیادی اکائی قیمت</th>
                  <th className="p-4 border-l font-bold text-gray-700 text-center text-base">کل رقم</th>
                  <th className="p-4 border-l font-bold text-gray-700 text-center text-base">دن</th>
                  <th className="p-4 border-l font-bold text-gray-700 text-center text-base">تاریخ</th>
                  <th className="p-4 border-l font-bold text-gray-700 text-center text-base">وقت</th>
                  <th className="p-4 text-center font-bold text-gray-700 text-base">انتخاب</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="p-16 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>ڈیٹا لوڈ ہو رہا ہے...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item.billitem_id} className="border-b hover:bg-indigo-50/30 transition-colors">
                      <td className="p-4 border-l font-bold text-gray-800">{item.item_name}</td>
                      
                      <td className="p-4 border-l text-center font-mono font-bold text-lg">
                        {item.quantity}
                      </td>

                      <td className="p-4 border-l text-center text-gray-700 font-semibold">
                        {item.item_unit || "N/A"}
                      </td>

                      <td className="p-4 border-l text-center text-gray-600 font-medium">
                        {item.requested_unit}
                      </td>

                      <td className="p-4 border-l text-center font-mono text-blue-700 font-bold">
                        Rs. {item.unit_price?.toLocaleString() || 0}
                      </td>

                      <td className="p-4 border-l text-center font-bold text-indigo-700">
                        Rs. {item.total_amount?.toLocaleString() || 0}
                      </td>

                      <td className="p-4 border-l text-center text-gray-600">{item.billitem_day_name}</td>
                      <td className="p-4 border-l text-center text-sm text-gray-600">
                        {item.billitem_day}/{item.billitem_month}/{item.billitem_year}
                      </td>
                      <td className="p-4 border-l text-center text-sm text-gray-600">{item.billitem_time}</td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => setDeleteId(item.billitem_id)}
                          className="text-red-600 hover:text-red-900 font-bold text-sm transition-all hover:scale-105"
                        >
                          🗑️ حذف
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="p-16 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">📭</span>
                        <span>کوئی بل آئٹم موجود نہیں ہے۔</span>
                        <button 
                          onClick={handleAddNew}
                          className="mt-2 text-indigo-600 hover:text-indigo-700 font-bold"
                        >
                          + نیا بل آئٹم شامل کریں
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex justify-center items-center gap-2 bg-gray-50 border-t">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg border font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-100"
              >
                ←
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`h-8 w-8 rounded-lg border font-bold transition-all text-sm ${
                    currentPage === i + 1 ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-lg border font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-100"
              >
                →
              </button>
            </div>
          )}
        </div>
      ) : (
        <BillItemForm 
          onCancel={() => handleFormClose(false)} 
          onSave={() => handleFormClose(true)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-scale-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2">کیا آپ کو یقین ہے؟</h3>
            <p className="text-gray-500 text-sm mb-6">یہ بل آئٹم ہمیشہ کے لیے حذف ہو جائے گا۔</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 text-sm transition-all">
                ہاں، حذف کریں
              </button>
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 text-sm transition-all">
                منسوخ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== Form Component ========================
function BillItemForm({ onCancel, onSave }) {
  const [formData, setFormData] = useState({
    item_name: "",
    quantity: "",
    requested_unit: "",
    custom_unit: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ text: "", type: "" });

  const validateForm = () => {
    let errs = {};

    if (!formData.item_name.trim()) {
      errs.item_name = "آئٹم کا نام درج کرنا ضروری ہے";
    } else if (formData.item_name.length < 2) {
      errs.item_name = "آئٹم کا نام کم از کم 2 حروف کا ہونا چاہیے";
    }

    if (!formData.quantity) {
      errs.quantity = "مقدار درج کرنا ضروری ہے";
    } else if (Number(formData.quantity) <= 0) {
      errs.quantity = "مقدار صفر سے زیادہ ہونی چاہیے";
    }

    const finalUnit = formData.requested_unit === "__custom" ? formData.custom_unit : formData.requested_unit;
    if (!finalUnit || !finalUnit.trim()) {
      errs.requested_unit = "اکائی منتخب کریں یا اپنی مرضی کی اکائی درج کریں";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormMessage({ text: "", type: "" });

    const finalUnit = formData.requested_unit === "__custom" 
      ? formData.custom_unit.trim() 
      : formData.requested_unit;

    const payload = {
      item_name: formData.item_name.trim(),
      quantity: Number(formData.quantity),
      requested_unit: finalUnit
    };

    try {
      await axios.post(`${API}/bill-items/`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setFormMessage({ text: "✅ بل آئٹم کامیابی سے شامل کر دیا گیا", type: "success" });
      setTimeout(() => onSave(), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "محفوظ کرنے میں ناکامی";
      setFormMessage({ text: errorMsg, type: "error" });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl mx-auto">
      {formMessage.text && (
        <div className="mb-4 p-3 rounded-xl text-center font-urdu transition-all duration-300"
          style={{
            backgroundColor: formMessage.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: formMessage.type === 'success' ? '#065f46' : '#991b1b',
            border: formMessage.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444'
          }}>
          <div className="flex items-center justify-center gap-2">
            {formMessage.type === 'success' ? <span className="text-lg">✅</span> : <span className="text-lg">❌</span>}
            <span>{formMessage.text}</span>
          </div>
        </div>
      )}

      <h3 className="text-2xl font-bold mb-6 border-r-4 border-indigo-600 pr-3 text-right">
        ➕ نیا بل آئٹم شامل کریں
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
            آئٹم کا نام <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.item_name}
            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
            className={`w-full p-3 border-2 rounded-xl outline-none transition-all text-right text-base ${
              errors.item_name ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-indigo-500"
            }`}
            placeholder="مثال: انڈے، دودھ، چاول"
          />
          {errors.item_name && <p className="text-red-600 text-sm mt-1 text-right">{errors.item_name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
              مقدار <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className={`w-full p-3 border-2 rounded-xl outline-none text-right text-base ${
                errors.quantity ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-indigo-500"
              }`}
              placeholder="مثال: 2.5"
            />
            {errors.quantity && <p className="text-red-600 text-sm mt-1 text-right">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
              اکائی <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.requested_unit}
              onChange={(e) => setFormData({ ...formData, requested_unit: e.target.value })}
              className={`w-full p-3 border-2 rounded-xl outline-none text-right text-base ${
                errors.requested_unit ? "border-red-500" : "border-gray-200 focus:border-indigo-500"
              }`}
            >
              <option value="">منتخب کریں</option>
              {ALLOWED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              <option value="__custom">✨ دیگر (اپنی مرضی کی)</option>
            </select>
            {errors.requested_unit && <p className="text-red-600 text-sm mt-1 text-right">{errors.requested_unit}</p>}
          </div>
        </div>

        {formData.requested_unit === "__custom" && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
              اپنی مرضی کی اکائی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.custom_unit}
              onChange={(e) => setFormData({ ...formData, custom_unit: e.target.value })}
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-right text-base outline-none focus:border-indigo-500"
              placeholder="مثال: پیالی، تھیلا"
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-base hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>شامل ہو رہا ہے...</span>
              </>
            ) : (
              "💾 شامل کریں"
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
          >
            ✕ منسوخ کریں
          </button>
        </div>
      </form>
    </div>
  );
}

export default BillItems;