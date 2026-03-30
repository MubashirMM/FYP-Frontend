import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const ALLOWED_UNITS = [
  "کلو", "گرام", "پاؤ", "چھٹانک", "سیر", "من", "بوری",
  "لیٹر", "ملی لیٹر", "عدد", "درجن", "آدھا درجن",
  "پیکٹ", "ڈبہ", "بوتل"
];

function BillItems() {
  const [view, setView] = useState("LIST"); // LIST or ADD
  const [billItems, setBillItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [deleteId, setDeleteId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const fetchBillItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/bill-items`, getAuthHeader());
      setBillItems(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      showMsg(err.response?.data?.detail || "بل آئٹمز لوڈ کرنے میں خرابی", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return fetchBillItems();

    try {
      const res = await axios.get(`${API}/bill-items/search/`, {
        params: { keyword: search },
        ...getAuthHeader()
      });
      setBillItems(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      showMsg(err.response?.data?.detail || "کوئی بل آئٹم نہیں ملا", "error");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/bill-items/${deleteId}`, getAuthHeader());
      showMsg("بل آئٹم کامیابی سے حذف کر دیا گیا", "success");
      setDeleteId(null);
      fetchBillItems();
    } catch (err) {
      showMsg(err.response?.data?.detail || "حذف کرنے میں خرابی", "error");
    }
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  useEffect(() => {
    fetchBillItems();
  }, []);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = billItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(billItems.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6" dir="rtl">
      {message.text && (
        <div className={`fixed top-6 left-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl ${
          message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-5 rounded-t-3xl shadow-sm border-b flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800">بل آئٹمز</h2>
          <p className="text-gray-500 text-sm">کل بل آئٹمز: {billItems.length}</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1">
            <input
              type="text"
              placeholder="آئٹم نام سے تلاش کریں..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-80 p-4 pr-12 border-2 border-gray-200 rounded-3xl focus:border-indigo-500 outline-none"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </form>

          <button
            onClick={() => setView("ADD")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-3xl font-bold transition-all active:scale-95 whitespace-nowrap"
          >
            + نیا بل آئٹم
          </button>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-b-3xl overflow-hidden border">
        {view === "LIST" ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right min-w-[1100px]">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-5 border-l font-bold">آئٹم نام</th>
                    <th className="p-5 border-l font-bold text-center">مقدار</th>
                    <th className="p-5 border-l font-bold text-center">اکائی</th>
                    <th className="p-5 border-l font-bold text-center">یونٹ قیمت</th>
                    <th className="p-5 border-l font-bold text-center">کل رقم</th>
                    <th className="p-5 border-l font-bold text-center">دن</th>
                    <th className="p-5 border-l font-bold text-center">تاریخ</th>
                    <th className="p-5 border-l font-bold text-center">وقت</th>
                    <th className="p-5 text-center font-bold">انتخاب</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="9" className="p-20 text-center text-gray-400">لوڈ ہو رہا ہے...</td></tr>
                  ) : currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <tr key={item.billitem_id} className="border-b hover:bg-indigo-50/30 transition-colors">
                        <td className="p-5 border-l font-bold">{item.item_name}</td>
                        <td className="p-5 border-l text-center font-mono font-bold">{item.quantity}</td>
                        <td className="p-5 border-l text-center">{item.requested_unit}</td>
                        <td className="p-5 border-l text-center font-mono">{item.unit_price}</td>
                        <td className="p-5 border-l text-center font-bold text-indigo-700">{item.total_amount}</td>
                        <td className="p-5 border-l text-center">{item.billitem_day_name}</td>
                        <td className="p-5 border-l text-center">{item.billitem_day} {item.billitem_month} {item.billitem_year}</td>
                        <td className="p-5 border-l text-center text-sm">{item.billitem_time}</td>
                        <td className="p-5 text-center">
                          <button
                            onClick={() => setDeleteId(item.billitem_id)}
                            className="text-red-600 hover:text-red-900 font-bold underline decoration-dotted"
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="9" className="p-20 text-center text-gray-500">کوئی بل آئٹم موجود نہیں ہے</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-5 flex justify-center gap-2 bg-gray-50 border-t">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-10 w-10 rounded-2xl border font-bold transition-all ${
                      currentPage === i + 1 ? "bg-indigo-600 text-white" : "hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <BillItemForm 
            onCancel={() => setView("LIST")} 
            onSave={() => { fetchBillItems(); setView("LIST"); }} 
            showMsg={showMsg} 
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">⚠️</div>
            <h3 className="text-2xl font-black mb-2">کیا آپ کو یقین ہے؟</h3>
            <p className="text-gray-500 mb-8">یہ بل آئٹم ہمیشہ کے لیے حذف ہو جائے گا۔</p>
            <div className="flex gap-4">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-4 rounded-3xl font-bold">ہاں، حذف کریں</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-100 py-4 rounded-3xl font-bold">منسوخ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================
// FORM COMPONENT (ADD ONLY)
// ========================
function BillItemForm({ onCancel, onSave, showMsg }) {
  const [formData, setFormData] = useState({
    item_name: "",
    quantity: "",
    requested_unit: "",
    custom_unit: ""
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let errs = {};

    if (!formData.item_name.trim()) errs.item_name = "آئٹم کا نام درج کریں۔";
    if (!formData.quantity || Number(formData.quantity) <= 0) errs.quantity = "مقدار صفر سے زیادہ ہونی چاہیے۔";

    const finalUnit = formData.requested_unit === "__custom" ? formData.custom_unit : formData.requested_unit;
    if (!finalUnit || !finalUnit.trim()) errs.requested_unit = "اکائی منتخب کریں یا اپنی مرضی کی اکائی درج کریں۔";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const finalUnit = formData.requested_unit === "__custom" 
      ? formData.custom_unit.trim() 
      : formData.requested_unit;

    const payload = {
      item_name: formData.item_name.trim(),
      quantity: Number(formData.quantity),
      requested_unit: finalUnit
    };

    try {
      await axios.post(`${API}/bill-items`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      showMsg("بل آئٹم کامیابی سے شامل کر دیا گیا", "success");
      onSave();
    } catch (err) {
      showMsg(err.response?.data?.detail || "محفوظ کرنے میں ناکامی", "error");
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-2xl mx-auto">
      <h3 className="text-3xl font-black mb-8 border-r-8 border-indigo-600 pr-4">
        نیا بل آئٹم شامل کریں
      </h3>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-black text-gray-700 mb-2">آئٹم کا نام</label>
          <input
            type="text"
            value={formData.item_name}
            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
            className={`w-full p-4 border-2 rounded-3xl outline-none text-base ${
              errors.item_name ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-indigo-500"
            }`}
            placeholder="مثلاً: انڈے، دودھ، چاول"
          />
          {errors.item_name && <p className="text-red-600 text-sm mt-1">{errors.item_name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">مقدار</label>
            <input
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className={`w-full p-4 border-2 rounded-3xl outline-none text-base ${
                errors.quantity ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-indigo-500"
              }`}
              placeholder="مثلاً: 2.5"
            />
            {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">اکائی</label>
            <select
              value={formData.requested_unit}
              onChange={(e) => setFormData({ ...formData, requested_unit: e.target.value })}
              className={`w-full p-4 border-2 rounded-3xl outline-none text-base ${
                errors.requested_unit ? "border-red-500" : "border-gray-200 focus:border-indigo-500"
              }`}
            >
              <option value="">اکائی منتخب کریں</option>
              {ALLOWED_UNITS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
              <option value="__custom">دیگر (اپنی مرضی کی)</option>
            </select>
            {errors.requested_unit && <p className="text-red-600 text-sm mt-1">{errors.requested_unit}</p>}
          </div>
        </div>

        {formData.requested_unit === "__custom" && (
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">اپنی مرضی کی اکائی کا نام</label>
            <input
              type="text"
              value={formData.custom_unit}
              onChange={(e) => setFormData({ ...formData, custom_unit: e.target.value })}
              className="w-full p-4 border-2 border-gray-200 rounded-3xl focus:border-indigo-500 outline-none text-base"
              placeholder="مثلاً: پیالی، تھیلا، بکس"
            />
          </div>
        )}

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl hover:bg-indigo-700 transition-all active:scale-95"
          >
            شامل کریں
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-5 rounded-3xl font-bold hover:bg-gray-200"
          >
            منسوخ
          </button>
        </div>
      </form>
    </div>
  );
}

export default BillItems;