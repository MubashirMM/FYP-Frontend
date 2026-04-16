import { useState, useEffect } from "react";
import axios from "axios";
import VoiceInput from "../components/VoiceInput";
import { ItemVoiceService } from "../services/ItemVoiceService";

const API = import.meta.env.VITE_API_URL;

const ALLOWED_UNITS = [
  "کلو", "گرام", "پاؤ", "چھٹانک", "سیر", "من", "بوری",
  "لیٹر", "ملی لیٹر", "عدد", "درجن", "آدھا درجن",
  "پیکٹ", "ڈبہ", "بوتل", "کلوگرام"
];

function Items({ onItemAdded, onClose }) {
  const [view, setView] = useState("LIST");
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [currentItem, setCurrentItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [autoFillFormData, setAutoFillFormData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/items`, getAuthHeader());
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setItems(data);
      setFilteredItems(data);
      setCurrentPage(1);
    } catch (err) {
      showMsg(err.response?.data?.detail || "آئٹمز لوڈ کرنے میں خرابی", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle voice command from VoiceInput
  const handleVoiceCommand = async (commandJson) => {
    console.log("Voice command received on Items page:", commandJson);
    
    const voiceService = new ItemVoiceService(showMsg, fetchItems);
    
    await voiceService.processCommand(commandJson, {
      onShowAddForm: (formData) => {
        console.log("onShowAddForm called with:", formData);
        // Clear any existing currentItem and set autoFill data
        setCurrentItem(null);
        setAutoFillFormData(formData);
        setShowForm(true);
      },
      onShowDeleteConfirm: (confirmData) => {
        console.log("onShowDeleteConfirm called with:", confirmData);
        setDeleteConfirm(confirmData);
      },
      onShowEditForm: (editData) => {
        console.log("onShowEditForm called with:", editData);
        // Clear autoFill and set current item for edit
        setAutoFillFormData(null);
        setCurrentItem(editData);
        setShowForm(true);
      },
      onSearch: (searchTerm) => {
        console.log("onSearch called with:", searchTerm);
        setSearch(searchTerm);
        const filtered = items.filter(item => 
          item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredItems(filtered);
        setCurrentPage(1);
        setView("LIST");
      },
      onShowAllItems: () => {
        console.log("onShowAllItems called");
        setSearch("");
        setFilteredItems(items); 
        setCurrentPage(1);
        setView("LIST");
      },
      onOpenItemsPopup: () => {
        console.log("onOpenItemsPopup called");
        // Already on Items page, no need to open popup
      }
    });
  };

  // Real-time search
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => 
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
    setCurrentPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await axios.delete(`${API}/items/${deleteConfirm.id}`, getAuthHeader());
      showMsg(`✅ "${deleteConfirm.name}" کامیابی سے حذف کر دیا گیا`, "success");
      setDeleteConfirm(null);
      fetchItems();
      if (onItemAdded) onItemAdded();
    } catch (err) {
      showMsg(err.response?.data?.detail || "حذف کرنے میں خرابی", "error");
    }
  };

  const handleAddNew = () => {
    setCurrentItem(null);
    setAutoFillFormData(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    const isCustomUnit = !ALLOWED_UNITS.includes(item.item_unit);
    const editData = {
      item_id: item.item_id,
      item_name: item.item_name,
      item_unit: isCustomUnit ? "__custom" : item.item_unit,
      custom_unit: isCustomUnit ? item.item_unit : "",
      unit_price: item.unit_price,
      stock_quantity: item.stock_quantity,
      mode: "EDIT"
    };
    setCurrentItem(editData);
    setAutoFillFormData(null);
    setShowForm(true);
  };

  const handleFormClose = (shouldRefresh = false) => {
    setShowForm(false);
    setCurrentItem(null);
    setAutoFillFormData(null);
    if (shouldRefresh) {
      fetchItems();
      if (onItemAdded) onItemAdded();
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Determine which data to pass to ItemForm
  const getFormInitialData = () => {
    if (currentItem) return currentItem;
    if (autoFillFormData) return autoFillFormData;
    return null;
  };

  const getFormMode = () => {
    if (currentItem) return currentItem.mode;
    if (autoFillFormData) return autoFillFormData.mode;
    return "ADD";
  };

  return (
    <div className="relative">
      {/* Voice Input Component - Floating Button */}
      <VoiceInput onCommandReceived={handleVoiceCommand} />

      {/* Message Toast */}
      {message.text && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl"
          style={{
            backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white'
          }}>
          <span className="font-urdu">{message.text}</span>
        </div>
      )}

      {!showForm ? (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b bg-gradient-to-r from-purple-50 to-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-urdu">📦 آئٹمز کی فہرست</h2>
                <p className="text-gray-500 text-sm mt-1">کل آئٹمز: {filteredItems.length}</p>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="🔍 آئٹم تلاش کریں..." 
                    value={search} 
                    onChange={handleSearchChange}
                    className="w-full md:w-80 p-3 pr-10 border-2 border-gray-200 rounded-xl bg-white focus:border-purple-500 focus:outline-none text-sm font-urdu"
                  />
                </div>
                <button 
                  onClick={handleAddNew} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold text-sm"
                >
                  + نیا آئٹم
                </button>
                {/* <button 
                  onClick={onClose} 
                  className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-xl font-bold text-sm"
                >
                  ✕ بند کریں
                </button> */}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-100 border-b sticky top-0">
                <tr>
                  <th className="p-4 border-l font-bold text-gray-700">آئٹم کا نام</th>
                  <th className="p-4 border-l font-bold text-gray-700">اکائی</th>
                  <th className="p-4 border-l font-bold text-gray-700 text-center">قیمت (PKR)</th>
                  <th className="p-4 border-l font-bold text-gray-700 text-center">موجودہ اسٹاک</th>
                  <th className="p-4 text-center font-bold text-gray-700">انتخاب</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-16 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>ڈیٹا لوڈ ہو رہا ہے...</span>
                      </div>
                     </td>
                   </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item.item_id} className="border-b hover:bg-purple-50/50">
                      <td className="p-4 border-l font-bold text-gray-800">{item.item_name}</td>
                      <td className="p-4 border-l text-gray-600">{item.item_unit}</td>
                      <td className="p-4 border-l text-center font-mono text-purple-700 font-bold">Rs. {item.unit_price.toLocaleString()}</td>
                      <td className={`p-4 border-l text-center font-bold ${item.stock_quantity <= 5 ? 'text-red-500' : 'text-green-700'}`}>
                        {item.stock_quantity} {item.item_unit}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-4">
                          <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900">✏️ ترمیم</button>
                          <button onClick={() => setDeleteConfirm({ id: item.item_id, name: item.item_name, unit: item.item_unit, quantity: item.stock_quantity })} className="text-red-600 hover:text-red-900">🗑️ حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-16 text-center text-gray-500">
                      کوئی ریکارڈ موجود نہیں ہے۔
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex justify-center gap-2 bg-gray-50 border-t">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-lg border bg-white">←</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded-lg border ${currentPage === i + 1 ? 'bg-purple-600 text-white' : 'bg-white'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded-lg border bg-white">→</button>
            </div>
          )}
        </div>
      ) : (
        <ItemForm 
          mode={getFormMode()}
          initialData={getFormInitialData()} 
          onCancel={() => handleFormClose(false)} 
          onSave={() => handleFormClose(true)}
          showMsg={showMsg}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2">کیا آپ کو یقین ہے؟</h3>
            <p className="text-gray-700 mb-2">آئٹم: <span className="font-bold text-red-600">{deleteConfirm.name}</span></p>
            <p className="text-gray-500 text-sm mb-4">موجودہ اسٹاک: {deleteConfirm.quantity} {deleteConfirm.unit}</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-3 rounded-xl">ہاں، حذف کریں</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl">منسوخ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ItemForm Component
function ItemForm({ mode, initialData, onCancel, onSave, showMsg }) {
  const [formData, setFormData] = useState({
    item_name: "", item_unit: "", custom_unit: "", unit_price: "", stock_quantity: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("ItemForm initialData received:", initialData);
    if (initialData) {
      setFormData({
        item_name: initialData.item_name || "",
        item_unit: initialData.item_unit || "",
        custom_unit: initialData.custom_unit || "",
        unit_price: initialData.unit_price || "",
        stock_quantity: initialData.stock_quantity || ""
      });
    } else {
      // Reset form when no initialData
      setFormData({
        item_name: "", item_unit: "", custom_unit: "", unit_price: "", stock_quantity: ""
      });
    }
  }, [initialData]);

  const validateForm = () => {
    let errs = {};
    if (!formData.item_name.trim()) errs.item_name = "آئٹم کا نام درج کریں";
    const unitValue = formData.item_unit === "__custom" ? formData.custom_unit : formData.item_unit;
    if (!unitValue?.trim()) errs.item_unit = "اکائی درج کریں";
    if (!formData.unit_price) errs.unit_price = "قیمت درج کریں";
    else if (Number(formData.unit_price) <= 0) errs.unit_price = "قیمت صفر سے زیادہ ہونی چاہیے";
    if (formData.stock_quantity === "") errs.stock_quantity = "مقدار درج کریں";
    else if (Number(formData.stock_quantity) < 0) errs.stock_quantity = "مقدار منفی نہیں ہو سکتی";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    
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
        showMsg("✅ آئٹم شامل کر دیا گیا", "success");
        setTimeout(() => onSave(), 1500);
      } else {
        await axios.patch(`${API}/items/${initialData.item_id}`, payload, config);
        showMsg("✅ آئٹم اپ ڈیٹ ہو گیا", "success");
        setTimeout(() => onSave(), 1500);
      }
    } catch (err) {
      showMsg(err.response?.data?.detail || "ڈیٹا محفوظ کرنے میں ناکامی", "error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold mb-6 border-r-4 border-purple-600 pr-3 text-right">
        {mode === "ADD" ? "➕ نیا آئٹم شامل کریں" : "✏️ آئٹم کی ترمیم کریں"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-right">آئٹم کا نام *</label>
          <input className={`w-full p-3 border-2 rounded-xl text-right ${errors.item_name ? 'border-red-500' : 'border-gray-200'}`} value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} />
          {errors.item_name && <p className="text-red-600 text-sm mt-1 text-right">{errors.item_name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">اکائی *</label>
            <select className="w-full p-3 border-2 rounded-xl text-right" value={formData.item_unit} onChange={e => setFormData({...formData, item_unit: e.target.value})}>
              <option value="">منتخب کریں</option>
              {ALLOWED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              <option value="__custom">✨ دیگر</option>
            </select>
          </div>
          {formData.item_unit === "__custom" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 text-right">اکائی کا نام *</label>
              <input className="w-full p-3 border-2 rounded-xl text-right" value={formData.custom_unit} onChange={e => setFormData({...formData, custom_unit: e.target.value})} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">قیمت فی اکائی (PKR) *</label>
            <input type="number" className="w-full p-3 border-2 rounded-xl text-right" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: e.target.value})} />
            {errors.unit_price && <p className="text-red-600 text-sm mt-1 text-right">{errors.unit_price}</p>}
          </div>
          <div> 
            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">موجودہ اسٹاک *</label>
            <input type="number" className="w-full p-3 border-2 rounded-xl text-right" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} />
            {errors.stock_quantity && <p className="text-red-600 text-sm mt-1 text-right">{errors.stock_quantity}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold">
            {isSubmitting ? "محفوظ ہو رہا ہے..." : "💾 محفوظ کریں"}
          </button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">✕ منسوخ کریں</button>
        </div>
      </form>
    </div>
  );
}

export default Items;