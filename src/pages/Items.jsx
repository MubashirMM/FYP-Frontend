import { useState, useEffect } from "react";
import axios from "axios"; 

const API = import.meta.env.VITE_API_URL;

const ALLOWED_UNITS = [
  "کلو", "گرام", "پاؤ", "چھٹانک", "سیر", "من", "بوری",
  "لیٹر", "ملی لیٹر", "عدد", "درجن", "آدھا درجن",
  "پیکٹ", "ڈبہ", "بوتل"
];

function Items() {
  const [view, setView] = useState("LIST");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [currentItem, setCurrentItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/items`, getAuthHeader());
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setItems(data);
      setCurrentPage(1);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || "آئٹمز لوڈ کرنے میں خرابی ہوئی";
      showMsg(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return fetchItems();
    try {
      const res = await axios.get(`${API}/items/search`, {
        params: { keywords: search },
        ...getAuthHeader()
      });
      setItems(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || "مطلوبہ آئٹم نہیں ملا";
      showMsg(errorMsg, "error");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/items/${deleteId}`, getAuthHeader());
      showMsg("آئٹم کامیابی سے حذف کر دیا گیا", "success");
      setDeleteId(null);
      fetchItems();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || "حذف کرنے میں تکنیکی خرابی";
      showMsg(errorMsg, "error");
    }
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6" dir="rtl">
      {message.text && (
        <div className={`fixed top-6 left-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl animate-bounce transition-all text-sm md:text-base ${
          message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-5 rounded-t-3xl shadow-sm border-b flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800">آئٹمز کی فہرست (Items)</h2>
          <p className="text-gray-500 text-sm">کل آئٹمز: {items.length}</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1">
            <input 
              type="text"
              placeholder="تلاش کریں..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-72 p-4 pr-12 border-2 border-gray-200 rounded-3xl bg-gray-50 focus:border-blue-500 focus:bg-white outline-none transition-all text-base"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          </form>
          <button 
            onClick={() => { setView("ADD"); setCurrentItem(null); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-3xl font-bold text-base transition-transform active:scale-95 whitespace-nowrap"
          >
            + نیا آئٹم
          </button>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-b-3xl overflow-hidden border">
        {view === "LIST" ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-5 border-l font-bold text-gray-700">آئٹم کا نام</th>
                    <th className="p-5 border-l font-bold text-gray-700">اکائی</th>
                    <th className="p-5 border-l font-bold text-gray-700 text-center">قیمت (PKR)</th>
                    <th className="p-5 border-l font-bold text-gray-700 text-center">موجودہ اسٹاک</th>
                    <th className="p-5 text-center font-bold text-gray-700">انتخاب</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="p-16 text-center text-gray-400">ڈیٹا لوڈ ہو رہا ہے...</td></tr>
                  ) : currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <tr key={item.item_id} className="border-b hover:bg-blue-50/50 transition-colors">
                        <td className="p-5 border-l font-bold text-gray-800">{item.item_name}</td>
                        <td className="p-5 border-l">{item.item_unit}</td>
                        <td className="p-5 border-l text-center font-mono text-blue-700 font-bold">{item.unit_price}</td>
                        <td className={`p-5 border-l text-center font-bold ${item.stock_quantity <= 5 ? 'text-red-500' : 'text-green-700'}`}>
                          {item.stock_quantity}
                        </td>
                        <td className="p-5 text-center flex justify-center gap-6">
                          <button 
                            onClick={() => { setCurrentItem(item); setView("EDIT"); }} 
                            className="text-indigo-600 hover:text-indigo-900 font-bold underline decoration-dotted"
                          >
                            ترمیم
                          </button>
                          <button 
                            onClick={() => setDeleteId(item.item_id)} 
                            className="text-red-600 hover:text-red-900 font-bold underline decoration-dotted"
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="p-16 text-center text-gray-500">کوئی ریکارڈ موجود نہیں ہے۔</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-5 flex justify-center items-center gap-2 bg-gray-50 border-t">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-10 w-10 rounded-2xl border font-bold transition-all ${
                      currentPage === i + 1 ? "bg-blue-600 text-white shadow-inner" : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <ItemForm 
            mode={view} 
            initialData={currentItem} 
            onCancel={() => { setView("LIST"); setCurrentItem(null); }} 
            onSave={() => { fetchItems(); setView("LIST"); }}
            showMsg={showMsg}
          />
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">⚠️</div>
            <h3 className="text-2xl font-black mb-2">کیا آپ کو یقین ہے؟</h3>
            <p className="text-gray-500 mb-8">یہ آئٹم ہمیشہ کے لیے حذف ہو جائے گا۔</p>
            <div className="flex gap-4">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-4 rounded-3xl font-black hover:bg-red-700">ہاں، حذف کریں</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-3xl font-bold hover:bg-gray-200">منسوخ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemForm({ mode, initialData, onCancel, onSave, showMsg }) {
  const [formData, setFormData] = useState({
    item_name: "",
    item_unit: "",
    custom_unit: "",
    unit_price: "",
    stock_quantity: ""
  });

  const [errors, setErrors] = useState({});

  // Prefill on Edit
  useEffect(() => {
    if (initialData) {
      setFormData({
        item_name: initialData.item_name || "",
        item_unit: initialData.item_unit || "",
        custom_unit: "",
        unit_price: initialData.unit_price || "",
        stock_quantity: initialData.stock_quantity || ""
      });
    }
  }, [initialData]);

  const validateForm = () => {
    let errs = {};
    if (!formData.item_name.trim()) errs.item_name = "نام درج کرنا ضروری ہے۔";
    const unitValue = formData.item_unit === "__custom" ? formData.custom_unit : formData.item_unit;
    if (!unitValue?.trim()) errs.item_unit = "اکائی درج کریں۔";
    if (!formData.unit_price || Number(formData.unit_price) <= 0) errs.unit_price = "قیمت صفر سے زیادہ ہونی چاہیے۔";
    if (formData.stock_quantity === "" || Number(formData.stock_quantity) < 0) errs.stock_quantity = "مقدار کم از کم صفر ہونی چاہیے۔";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const finalUnit = formData.item_unit === "__custom" ? formData.custom_unit : formData.item_unit;
    const payload = {
      item_name: formData.item_name.trim(),
      item_unit: finalUnit.trim(),
      unit_price: Number(formData.unit_price),
      stock_quantity: Number(formData.stock_quantity)
    };

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
      if (mode === "ADD") {
        await axios.post(`${API}/items`, payload, config);
        showMsg("آئٹم کامیابی سے شامل کر دیا گیا", "success");
      } else {
        await axios.patch(`${API}/items/${initialData.item_id}`, payload, config);
        showMsg("آئٹم کی تفصیلات اپ ڈیٹ ہو گئیں", "success");
      }
      onSave();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || "ڈیٹا محفوظ کرنے میں ناکامی";
      showMsg(errorMsg, "error");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h3 className="text-3xl font-black mb-8 border-r-8 border-blue-600 pr-4">
        {mode === "ADD" ? "نیا اسٹاک شامل کریں" : "آئٹم کی ترمیم"}
      </h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:gap-8">
        <div>
          <label className="block text-sm font-black text-gray-700 mb-2">آئٹم کا نام</label>
          <input 
            className={`w-full p-4 border-2 rounded-3xl outline-none transition-all text-base ${errors.item_name ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`} 
            value={formData.item_name} 
            onChange={e => setFormData({...formData, item_name: e.target.value})} 
          />
          {errors.item_name && <p className="text-red-600 text-sm mt-1">{errors.item_name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">اکائی (Unit)</label>
            <select 
              className={`w-full p-4 border-2 rounded-3xl outline-none text-base ${errors.item_unit ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'}`} 
              value={formData.item_unit} 
              onChange={e => setFormData({...formData, item_unit: e.target.value})}
            >
              <option value="">منتخب کریں</option>
              {ALLOWED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              <option value="__custom">دیگر (اپنی مرضی کی)</option>
            </select>
            {errors.item_unit && <p className="text-red-600 text-sm mt-1">{errors.item_unit}</p>}
          </div>

          {formData.item_unit === "__custom" && (
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">اکائی کا نام</label>
              <input 
                className="w-full p-4 border-2 border-gray-200 rounded-3xl text-base outline-none focus:border-blue-500" 
                value={formData.custom_unit} 
                onChange={e => setFormData({...formData, custom_unit: e.target.value})} 
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">قیمت فی اکائی</label>
            <input 
              type="number" 
              step="0.01"
              className={`w-full p-4 border-2 rounded-3xl outline-none text-base ${errors.unit_price ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`} 
              value={formData.unit_price} 
              onChange={e => setFormData({...formData, unit_price: e.target.value})} 
            />
            {errors.unit_price && <p className="text-red-600 text-sm mt-1">{errors.unit_price}</p>}
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">موجودہ اسٹاک</label>
            <input 
              type="number" 
              className={`w-full p-4 border-2 rounded-3xl outline-none text-base ${errors.stock_quantity ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`} 
              value={formData.stock_quantity} 
              onChange={e => setFormData({...formData, stock_quantity: e.target.value})} 
            />
            {errors.stock_quantity && <p className="text-red-600 text-sm mt-1">{errors.stock_quantity}</p>}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-5 rounded-3xl font-black text-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
            محفوظ کریں
          </button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 text-gray-700 py-5 rounded-3xl font-bold hover:bg-gray-200">
            منسوخ
          </button>
        </div>
      </form>
    </div>
  );
}

export default Items;