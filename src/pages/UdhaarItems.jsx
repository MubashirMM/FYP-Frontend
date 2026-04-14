

import { useState, useEffect } from "react";
import axios from "axios";
import VoiceInput from "../components/VoiceInput";
import { UdhaarItemsVoiceService } from "../services/UdhaarItemsVoiceService";

const API = import.meta.env.VITE_API_URL;

const ALLOWED_UNITS = [
  "کلو", "گرام", "پاؤ", "چھٹانک", "سیر", "من", "بوری",
  "لیٹر", "ملی لیٹر", "عدد", "درجن", "آدھا درجن",
  "پیکٹ", "ڈبہ", "بوتل"
];

function UdhaarItems({ onItemAdded, onClose }) {
  const [udhaarItems, setUdhaarItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [currentItem, setCurrentItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [autoFillFormData, setAutoFillFormData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const fetchUdhaarItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/udhar-items/`, getAuthHeader());
      const data = Array.isArray(res.data) ? res.data : [];
      setUdhaarItems(data);
      setFilteredItems(data);
      setCurrentPage(1);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || "اُدھار آئٹمز لوڈ کرنے میں خرابی ہوئی";
      showMsg(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle voice command from VoiceInput
  const handleVoiceCommand = async (commandJson) => {
    console.log("Voice command received on Udhaar page:", commandJson);
    
    const voiceService = new UdhaarItemsVoiceService(showMsg, fetchUdhaarItems);
    
    await voiceService.processCommand(commandJson, {
      onShowAddForm: (formData) => {
        console.log("onShowAddForm called with:", formData);
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
        setAutoFillFormData(null);
        setCurrentItem(editData);
        setShowForm(true);
      },
      onSearch: (searchTerm) => {
        console.log("onSearch called with:", searchTerm);
        setSearch(searchTerm);
        const filtered = udhaarItems.filter(item => 
          item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredItems(filtered);
        setCurrentPage(1);
      },
      onShowAllUdhaar: () => {
        console.log("onShowAllUdhaar called");
        setSearch("");
        setFilteredItems(udhaarItems);
        setCurrentPage(1);
      },
      onOpenUdhaarPopup: () => {
        console.log("onOpenUdhaarPopup called");
      }
    });
  };

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredItems(udhaarItems);
    } else {
      const filtered = udhaarItems.filter(item => 
        item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
    setCurrentPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await axios.delete(`${API}/udhar-items/${deleteConfirm.id}`, getAuthHeader());
      showMsg(`✅ "${deleteConfirm.customer}" کا "${deleteConfirm.name}" کامیابی سے حذف کر دیا گیا`, "success");
      setDeleteConfirm(null);
      fetchUdhaarItems();
      if (onItemAdded) onItemAdded();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || "حذف کرنے میں خرابی ہوئی";
      showMsg(errorMsg, "error");
    }
  };

  const handleAddNew = () => {
    setCurrentItem(null);
    setAutoFillFormData(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    const requestedUnit = item.requested_unit || "";
    const isCustomUnit = !ALLOWED_UNITS.includes(requestedUnit);
    const editData = {
      udharitem_id: item.udharitem_id,
      customer_name: item.customer_name,
      item_name: item.item_name,
      quantity: item.quantity,
      unit: isCustomUnit ? "__custom" : requestedUnit,
      custom_unit: isCustomUnit ? requestedUnit : "",
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
      fetchUdhaarItems();
      if (onItemAdded) onItemAdded();
    }
  };

  useEffect(() => {
    fetchUdhaarItems();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

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
      {/* Voice Input Component */}
      <VoiceInput onCommandReceived={handleVoiceCommand} />

      {/* Message Toast */}
      {message.text && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl"
          style={{
            backgroundColor: message.type === 'success' ? '#10b981' : message.type === 'info' ? '#3b82f6' : '#ef4444',
            color: 'white'
          }}>
          <span className="font-urdu">{message.text}</span>
        </div>
      )}

      {!showForm ? (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b bg-gradient-to-r from-amber-50 to-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-urdu">📋 اُدھار آئٹمز</h2>
                <p className="text-gray-500 text-sm mt-1">کل اُدھار: {filteredItems.length}</p>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="🔍 کسٹمر یا آئٹم تلاش کریں..." 
                    value={search} 
                    onChange={handleSearchChange}
                    className="w-full md:w-80 p-3 pr-10 border-2 border-gray-200 rounded-xl bg-white focus:border-amber-500 focus:outline-none text-sm font-urdu"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                </div>
                <button 
                  onClick={handleAddNew} 
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                >
                  <span>+</span> نیا اُدھار
                </button>
                <button 
                  onClick={onClose} 
                  className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-xl font-bold text-sm"
                >
                  ✕ بند کریں
                </button>
              </div>
            </div>
          </div>

        {/* Table */}
<div className="overflow-x-auto max-h-[500px] overflow-y-auto">
  <table className="w-full text-right">
    <thead className="bg-gray-100 border-b sticky top-0">
      <tr>
        <th className="p-4 border-l font-bold text-gray-700 text-base">کسٹمر</th>
        <th className="p-4 border-l font-bold text-gray-700 text-base">آئٹم</th>
        <th className="p-4 border-l font-bold text-gray-700 text-center text-base">مقدار (درخواست شدہ اکائی)</th>
        <th className="p-4 border-l font-bold text-gray-700 text-center text-base">بنیادی اکائی</th>
        <th className="p-4 border-l font-bold text-gray-700 text-center text-base">درخواست شدہ اکائی</th>
        <th className="p-4 border-l font-bold text-gray-700 text-center text-base">فی بنیادی اکائی قیمت</th>
        <th className="p-4 border-l font-bold text-gray-700 text-center text-base">کل رقم</th>
        <th className="p-4 border-l font-bold text-gray-700 text-center text-base">تاریخ</th>
        <th className="p-4 text-center font-bold text-gray-700 text-base">انتخاب</th>
      </tr>
    </thead>
    <tbody>
      {loading ? (
        <tr>
          <td colSpan="9" className="p-16 text-center text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <span>ڈیٹا لوڈ ہو رہا ہے...</span>
            </div>
          </td>
        </tr>
      ) : currentItems.length > 0 ? (
        currentItems.map((item) => (
          <tr key={item.udharitem_id} className="border-b hover:bg-amber-50/50 transition-colors">
            <td className="p-4 border-l font-bold text-gray-800">{item.customer_name}</td>
            <td className="p-4 border-l text-gray-600">{item.item_name}</td>
            
            <td className="p-4 border-l text-center font-mono font-bold text-lg">
              {item.quantity}
            </td>

            <td className="p-4 border-l text-center text-gray-700 font-semibold">
              {item.base_unit || "N/A"}
            </td>

            <td className="p-4 border-l text-center text-gray-600 font-medium">
              {item.requested_unit}
            </td>

            <td className="p-4 border-l text-center font-mono text-blue-700 font-bold">
              Rs. {item.unit_price?.toLocaleString() || 0}
            </td>

            <td className="p-4 border-l text-center font-mono text-amber-700 font-bold">
              Rs. {item.total_amount?.toLocaleString() || 0}
            </td>

            <td className="p-4 border-l text-center text-sm text-gray-600">
              {item.udhar_day}/{item.udhar_month}/{item.udhar_year}
            </td>

            <td className="p-4 text-center">
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => handleEdit(item)} 
                  className="text-indigo-600 hover:text-indigo-900 font-bold text-sm transition-all hover:scale-105"
                >
                  ✏️ ترمیم
                </button>
                <button 
                  onClick={() => setDeleteConfirm({ 
                    id: item.udharitem_id, 
                    name: item.item_name,
                    customer: item.customer_name,
                    quantity: item.quantity,
                    unit: item.requested_unit,
                    totalAmount: item.total_amount
                  })} 
                  className="text-red-600 hover:text-red-900 font-bold text-sm transition-all hover:scale-105"
                >
                  🗑️ حذف
                </button>
              </div>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="9" className="p-16 text-center text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <span className="text-4xl">📭</span>
              <span>کوئی اُدھار آئٹم موجود نہیں ہے۔</span>
            </div>
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
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded-lg border ${currentPage === i + 1 ? 'bg-amber-600 text-white' : 'bg-white'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded-lg border bg-white">→</button>
            </div>
          )}
        </div>
      ) : (
        <UdhaarItemForm 
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
            <p className="text-gray-700 mb-1">کسٹمر: <span className="font-bold text-amber-600">{deleteConfirm.customer}</span></p>
            <p className="text-gray-700 mb-1">آئٹم: <span className="font-bold text-red-600">{deleteConfirm.name}</span></p>
            <p className="text-gray-500 text-sm mb-1">مقدار: {deleteConfirm.quantity} {deleteConfirm.unit}</p>
            <p className="text-gray-500 text-sm mb-4">کل رقم: Rs. {deleteConfirm.totalAmount?.toLocaleString() || 0}</p>
            <p className="text-gray-500 text-sm mb-6">یہ اُدھار آئٹم ہمیشہ کے لیے حذف ہو جائے گا۔</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold">ہاں، حذف کریں</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-bold">منسوخ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== UdhaarItemForm Component (NO PRICE FIELD) ====================
function UdhaarItemForm({ mode, initialData, onCancel, onSave, showMsg }) {
  const [formData, setFormData] = useState({
    customer_name: "",
    item_name: "",
    quantity: "",
    unit: "",
    custom_unit: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        customer_name: initialData.customer_name || "",
        item_name: initialData.item_name || "",
        quantity: initialData.quantity || "",
        unit: initialData.unit || "",
        custom_unit: initialData.custom_unit || ""
      });
    }
  }, [initialData]);

  const validateForm = () => {
    let errs = {};
    if (!formData.customer_name?.trim()) errs.customer_name = "کسٹمر کا نام درج کریں";
    if (!formData.item_name?.trim()) errs.item_name = "آئٹم کا نام درج کریں";
    const unitValue = formData.unit === "__custom" ? formData.custom_unit : formData.unit;
    if (!unitValue?.trim()) errs.unit = "اکائی درج کریں";
    if (!formData.quantity) errs.quantity = "مقدار درج کریں";
    else if (Number(formData.quantity) <= 0) errs.quantity = "مقدار صفر سے زیادہ ہونی چاہیے";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    const finalUnit = formData.unit === "__custom" ? formData.custom_unit : formData.unit;
    const payload = {
      customer_name: formData.customer_name.trim(),
      item_name: formData.item_name.trim(),
      quantity: Number(formData.quantity),
      unit: finalUnit.trim()
    };

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
      
      if (mode === "ADD") {
        await axios.post(`${API}/udhar-items`, payload, config);
        showMsg("✅ اُدھار آئٹم شامل کر دیا گیا", "success");
      } else if (initialData?.udharitem_id) {
        await axios.put(`${API}/udhar-items/${initialData.udharitem_id}`, payload, config);
        showMsg("✅ اُدھار آئٹم اپ ڈیٹ ہو گیا", "success");
      }
      
      setTimeout(() => onSave(), 1500);
    } catch (err) {
      showMsg(err.response?.data?.detail || "ڈیٹا محفوظ کرنے میں ناکامی", "error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold mb-6 border-r-4 border-amber-600 pr-3 text-right">
        {mode === "ADD" ? "➕ نیا اُدھار آئٹم شامل کریں" : "✏️ اُدھار آئٹم میں ترمیم کریں"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-right">کسٹمر کا نام *</label>
          <input 
            className={`w-full p-3 border-2 rounded-xl outline-none transition-all text-right text-base ${
              errors.customer_name ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-amber-500'
            }`} 
            value={formData.customer_name} 
            onChange={e => setFormData({...formData, customer_name: e.target.value})} 
            placeholder="مثال: محمد علی"
          />
          {errors.customer_name && <p className="text-red-600 text-sm mt-1 text-right">{errors.customer_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
            آئٹم کا نام <span className="text-red-500">*</span>
          </label>
          <input 
            className={`w-full p-3 border-2 rounded-xl outline-none transition-all text-right text-base ${
              errors.item_name ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-amber-500'
            }`} 
            value={formData.item_name} 
            onChange={e => setFormData({...formData, item_name: e.target.value})} 
            placeholder="مثال: چاول, آٹا, دال"
          />
          {errors.item_name && <p className="text-red-600 text-sm mt-1 text-right">{errors.item_name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
              اکائی <span className="text-red-500">*</span>
            </label>
            <select 
              className={`w-full p-3 border-2 rounded-xl outline-none text-right text-base ${
                errors.unit ? 'border-red-500' : 'border-gray-200 focus:border-amber-500'
              }`} 
              value={formData.unit} 
              onChange={e => setFormData({...formData, unit: e.target.value})}
            >
              <option value="">منتخب کریں</option>
              {ALLOWED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              <option value="__custom">✨ دیگر (اپنی مرضی کی)</option>
            </select>
            {errors.unit && <p className="text-red-600 text-sm mt-1 text-right">{errors.unit}</p>}
          </div>

          {formData.unit === "__custom" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
                اپنی مرضی کی اکائی <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-right text-base outline-none focus:border-amber-500" 
                value={formData.custom_unit} 
                onChange={e => setFormData({...formData, custom_unit: e.target.value})} 
                placeholder="مثال: پیکٹ, ڈبہ"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
              مقدار <span className="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              step="0.01"
              className={`w-full p-3 border-2 rounded-xl outline-none transition-all text-right text-base ${
                errors.quantity ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-amber-500'
              }`} 
              value={formData.quantity} 
              onChange={e => setFormData({...formData, quantity: e.target.value})} 
              placeholder="0.00"
            />
            {errors.quantity && <p className="text-red-600 text-sm mt-1 text-right">{errors.quantity}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-bold text-base hover:bg-amber-700 disabled:bg-amber-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>محفوظ ہو رہا ہے...</span>
              </>
            ) : (
              "💾 محفوظ کریں"
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

export default UdhaarItems;