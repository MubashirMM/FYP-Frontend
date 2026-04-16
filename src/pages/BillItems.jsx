import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const ALLOWED_UNITS = [
  "کلو", "گرام", "پاؤ", "چھٹانک", "سیر", "من", "بوری",
  "لیٹر", "ملی لیٹر", "عدد", "درجن", "آدھا درجن",
  "پیکٹ", "ڈبہ", "بوتل"
];

function BillItems({ onItemAdded, onClose }) {
  const [cartItems, setCartItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [deleteId, setDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [showBillPreview, setShowBillPreview] = useState(null);
  const [shopInfo, setShopInfo] = useState({ shop_name: "میرا اسٹور", owner_name: "", address: "" });
  const [user, setUser] = useState(null);
  const [autoFillFormData, setAutoFillFormData] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, getAuthHeader());
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };

  const fetchShopInfo = async () => {
    try {
      const res = await axios.get(`${API}/shops/`, getAuthHeader());
      if (res.data?.length > 0) setShopInfo(res.data[0]);
    } catch {}
  };

  // Fetch cart items
  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/cart/items`, getAuthHeader());
      const data = Array.isArray(res.data) ? res.data : [];
      setCartItems(data);
      setFilteredItems(data);
      setCurrentPage(1);
    } catch (err) {
      if (err.response?.status !== 404) {
        showMsg(err.response?.data?.detail || "کارٹ آئٹمز لوڈ کرنے میں خرابی", "error");
      }
      setCartItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate bill from cart
  const handleGenerateBill = async () => {
    if (cartItems.length === 0) {
      showMsg("❌ کارٹ خالی ہے - پہلے آئٹمز شامل کریں", "error");
      return;
    }

    setGeneratingBill(true);
    try {
      const res = await axios.post(`${API}/cart/generate-bill`, {}, getAuthHeader());
      setShowBillPreview(res.data);
      showMsg("✅ بل کامیابی سے جنریٹ ہو گیا", "success");
      
      await fetchCartItems();
      if (onItemAdded) onItemAdded();
    } catch (err) {
      showMsg(err.response?.data?.detail || "بل جنریٹ کرنے میں خرابی", "error");
    } finally {
      setGeneratingBill(false);
    }
  };

  // Print bill
  const printBill = (billData) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>نقد بل - ${billData.bill_id}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            padding: 40px;
            line-height: 1.6;
            background: #fff;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #ddd;
            padding-bottom: 20px;
          }
          .shop-name {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
          }
          .shop-address {
            color: #666;
            font-size: 14px;
          }
          .bill-title {
            text-align: center;
            margin: 30px 0;
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          .bill-info {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 12px;
            flex-wrap: wrap;
            gap: 15px;
          }
          .info-group {
            text-align: center;
            flex: 1;
          }
          .info-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 16px;
            font-weight: bold;
            color: #333;
          }
          .items-table {
            width: 100%;
            margin: 30px 0;
            border-collapse: collapse;
          }
          .items-table th,
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            text-align: center;
          }
          .items-table th {
            background: #f5f5f5;
            font-weight: bold;
            border-bottom: 2px solid #ddd;
          }
          .items-table td:first-child {
            text-align: right;
          }
          .total-box {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .total-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
          }
          .total-value {
            font-size: 48px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #999;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${shopInfo.shop_name || "میرا اسٹور"}</div>
          <div class="shop-address">${shopInfo.address || ""}</div>
          <div class="shop-address">مالک: ${shopInfo.owner_name || user?.username || ""}</div>
        </div>
        <div class="bill-title">💰 نقد بل</div>
        <div class="bill-info">
          <div class="info-group"><div class="info-label">بل نمبر</div><div class="info-value">#${billData.bill_id}</div></div>
          <div class="info-group"><div class="info-label">کسٹمر</div><div class="info-value">${billData.customer_name || "نقد"}</div></div>
          <div class="info-group"><div class="info-label">تاریخ</div><div class="info-value">${billData.bill_day_name}، ${billData.bill_day} ${billData.bill_month} ${billData.bill_year}</div></div>
          <div class="info-group"><div class="info-label">وقت</div><div class="info-value">${billData.bill_time}</div></div>
        </div>
        <table class="items-table">
          <thead><tr><th>آئٹم</th><th>مقدار</th><th>اکائی</th><th>فی اکائی (Rs.)</th><th>کل (Rs.)</th></tr></thead>
          <tbody>
            ${billData.items?.map(item => `
              <tr><td>${item.item_name}</td><td>${item.quantity}</td><td>${item.requested_unit}</td><td>${item.unit_price}</td><td>${item.total_amount}</td></tr>
            `).join('') || '<tr><td colspan="5">کوئی آئٹم نہیں</td></tr>'}
          </tbody>
        </table>
        <div class="total-box"><div class="total-label">کل قابل ادائیگی</div><div class="total-value">${billData.total_amount?.toLocaleString()} روپے</div></div>
        <div class="footer">شکریہ! دوبارہ تشریف لائیں۔</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredItems(cartItems);
    } else {
      const filtered = cartItems.filter(item => 
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
    setCurrentPage(1);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/cart/item/${deleteId}`, getAuthHeader());
      showMsg("✅ آئٹم کارٹ سے حذف کر دیا گیا", "success");
      setDeleteId(null);
      fetchCartItems();
      if (onItemAdded) onItemAdded();
    } catch (err) {
      showMsg(err.response?.data?.detail || "حذف کرنے میں خرابی", "error");
    }
  };

  const handleClearCart = async () => {
    if (cartItems.length === 0) {
      showMsg("کارٹ پہلے سے خالی ہے", "error");
      return;
    }
    
    try {
      await axios.delete(`${API}/cart/clear`, getAuthHeader());
      showMsg("✅ کارٹ خالی کر دیا گیا", "success");
      fetchCartItems();
      if (onItemAdded) onItemAdded();
    } catch (err) {
      showMsg(err.response?.data?.detail || "کارٹ خالی کرنے میں خرابی", "error");
    }
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleAddNew = () => {
    setAutoFillFormData(null);
    setShowForm(true);
  };

  const handleFormClose = (shouldRefresh = false) => {
    setShowForm(false);
    setAutoFillFormData(null);
    if (shouldRefresh) {
      fetchCartItems();
      if (onItemAdded) onItemAdded();
    }
  };

  useEffect(() => {
    fetchCartItems();
    fetchShopInfo();
    fetchUser();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  
  const totalCartAmount = cartItems.reduce((sum, item) => sum + (item.total_amount || 0), 0);
  const totalCartItems = cartItems.length;

  return (
    <div className="relative min-h-screen bg-gray-50 p-3 md:p-6" dir="rtl">
      {/* Message Toast */}
      {message.text && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl animate-slide-down text-sm md:text-base transition-all duration-300"
          style={{
            backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white'
          }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{message.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-urdu">{message.text}</span>
          </div>
        </div>
      )}

      {/* Bill Preview Modal */}
      {showBillPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">🧾 بل کی تفصیل</h2>
              <button onClick={() => setShowBillPreview(null)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-green-700">💰 نقد بل</h3>
                <p className="text-gray-600">بل نمبر: #{showBillPreview.bill_id}</p>
                <p className="text-gray-600">تاریخ: {showBillPreview.bill_day} {showBillPreview.bill_month} {showBillPreview.bill_year}</p>
                <p className="text-gray-600">وقت: {showBillPreview.bill_time} | {showBillPreview.bill_day_name}</p>
              </div>
              
              <table className="w-full text-right mb-6 border-collapse">
                <thead className="bg-gray-100">
                  <tr><th className="p-3 border">آئٹم</th><th className="p-3 border text-center">مقدار/</th><th className="p-3 border text-center">اکائی</th><th className="p-3 border text-center">قیمت/اکائی</th><th className="p-3 border text-center">کل رقم</th></tr>
                </thead>
                <tbody>
                  {showBillPreview.items?.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-3 border">{item.item_name}</td>
                      <td className="p-3 border text-center">{item.quantity}</td>
                      <td className="p-3 border text-center">{item.requested_unit}</td>
                      <td className="p-3 border text-center">Rs. {item.unit_price}</td>
                      <td className="p-3 border text-center font-bold">Rs. {item.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-green-50 font-bold">
                    <td colSpan="4" className="p-3 text-left text-lg">کل رقم:</td>
                    <td className="p-3 text-center text-xl text-green-700">Rs. {showBillPreview.total_amount?.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              
              <div className="flex gap-3">
                <button onClick={() => printBill(showBillPreview)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">🖨️ پرنٹ بل</button>
                {/* <button onClick={() => setShowBillPreview(null)} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300">✕ بند کریں</button> */}
              </div>
            </div>
          </div>
        </div>
      )}

      {!showForm ? (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b bg-gradient-to-r from-green-50 to-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-urdu">💰 نقد آئٹمز</h2>
                <p className="text-gray-500 text-sm mt-1">کل آئٹمز: {filteredItems.length} | کل رقم: Rs. {totalCartAmount.toLocaleString()}</p>
              </div>

              <div className="flex gap-3 w-full md:w-auto flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <input 
                    type="text"
                    placeholder="🔍 آئٹم نام سے تلاش کریں..." 
                    value={search} 
                    onChange={handleSearchChange}
                    className="w-full md:w-80 p-3 pr-10 border-2 border-gray-200 rounded-xl bg-white focus:border-green-500 focus:outline-none transition-all text-sm font-urdu"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                </div>
                <button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2">+ نیا نقد آئٹم</button>
                <button onClick={handleClearCart} disabled={cartItems.length === 0} className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:bg-gray-400">🗑️ کارٹ خالی کریں</button>
                <button onClick={handleGenerateBill} disabled={generatingBill || cartItems.length === 0} className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${cartItems.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                  {generatingBill ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>بل بن رہا ہے...</span></> : "🧾 بل جنریٹ کریں"}
                </button>
                {/* <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-xl font-bold text-sm">✕ بند کریں</button> */}
              </div>
            </div>
          </div>

          {/* Cart Summary Bar */}
          {cartItems.length > 0 && (
            <div className="bg-blue-50 p-3 border-b flex justify-between items-center">
              <span className="text-sm text-blue-800">🛒 کارٹ میں کل {totalCartItems} آئٹمز ہیں</span>
              <span className="text-lg font-bold text-blue-900">کل رقم: Rs. {totalCartAmount.toLocaleString()}</span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-right min-w-[1200px]">
              <thead className="bg-gray-100 border-b sticky top-0">
                <tr>
                  <th className="p-4 border-l font-bold text-gray-700 text-base">آئٹم نام</th>
                  {/* <th className="p-4 border-l font-bold text-gray-700 text-center text-base">مقدار</th> */}
                  <th className="p-4 border-l font-bold text-gray-700 text-center text-base">مقدار(درخواست شدہ اکائی میں )</th>
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
                  <tr><td colSpan="10" className="p-16 text-center text-gray-400"><div className="flex flex-col items-center gap-2"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div><span>ڈیٹا لوڈ ہو رہا ہے...</span></div></td></tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item.billitem_id} className="border-b hover:bg-green-50/30 transition-colors">
                      <td className="p-4 border-l font-bold text-gray-800">{item.item_name}</td>
                      <td className="p-4 border-l text-center font-mono font-bold text-lg">{item.quantity}</td>
                      <td className="p-4 border-l text-center text-gray-700 font-semibold">{item.item_unit || "N/A"}</td>
                      <td className="p-4 border-l text-center text-gray-600 font-medium">{item.requested_unit}</td>
                      <td className="p-4 border-l text-center font-mono text-blue-700 font-bold">Rs. {item.unit_price?.toLocaleString() || 0}</td>
                      <td className="p-4 border-l text-center font-bold text-green-700">Rs. {item.total_amount?.toLocaleString() || 0}</td>
                      <td className="p-4 border-l text-center text-gray-600">{item.billitem_day_name}</td>
                      <td className="p-4 border-l text-center text-sm text-gray-600">{item.billitem_day}/{item.billitem_month}/{item.billitem_year}</td>
                      <td className="p-4 border-l text-center text-sm text-gray-600">{item.billitem_time}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => setDeleteId(item.billitem_id)} className="text-red-600 hover:text-red-900 font-bold text-sm transition-all hover:scale-105">🗑️ حذف</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="p-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-4xl">🛒</div>
                        <p className="text-gray-500 text-lg font-medium">
                          {search ? `"${search}" کے نام سے کوئی آئٹم نہیں ملا` : "کارٹ خالی ہے۔ براہ کرم نیا آئٹم شامل کریں"}
                        </p>
                        {search && (
                          <button onClick={() => { setSearch(""); fetchCartItems(); }} className="text-green-600 hover:text-green-700 font-bold underline">تمام آئٹمز دیکھیں</button>
                        )}
                        {!search && cartItems.length === 0 && (
                          <button onClick={handleAddNew} className="mt-2 text-green-600 hover:text-green-700 font-bold">+ نیا نقد آئٹم شامل کریں</button>
                        )}
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
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="h-8 w-8 rounded-lg border font-bold text-sm disabled:opacity-50 bg-white hover:bg-gray-100">←</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`h-8 w-8 rounded-lg border font-bold text-sm ${currentPage === i + 1 ? "bg-green-600 text-white border-green-600" : "bg-white hover:bg-gray-100"}`}>{i + 1}</button>
              ))}
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="h-8 w-8 rounded-lg border font-bold text-sm disabled:opacity-50 bg-white hover:bg-gray-100">→</button>
            </div>
          )}
        </div>
      ) : (
        <BillItemForm 
          initialData={autoFillFormData}
          onCancel={() => handleFormClose(false)} 
          onSave={() => handleFormClose(true)}
          showMsg={showMsg}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2">کیا آپ کو یقین ہے؟</h3>
            <p className="text-gray-500 text-sm mb-6">یہ آئٹم کارٹ سے ہمیشہ کے لیے حذف ہو جائے گا۔</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 text-sm">ہاں، حذف کریں</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 text-sm">منسوخ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== BillItemForm Component ========================
function BillItemForm({ initialData, onCancel, onSave, showMsg }) {
  const [formData, setFormData] = useState({
    item_name: "",
    quantity: "",
    requested_unit: "",
    custom_unit: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [isCustomItem, setIsCustomItem] = useState(false);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Fetch available items
  const fetchAvailableItems = async () => {
    setItemsLoading(true);
    try {
      const res = await axios.get(`${API}/items/`, getAuthHeader());
      setAvailableItems(res.data || []);
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableItems();
    
    // Set initial data if provided (from voice command)
    if (initialData) {
      setFormData({
        item_name: initialData.item_name || "",
        quantity: initialData.quantity || "",
        requested_unit: initialData.requested_unit || "",
        custom_unit: initialData.custom_unit || ""
      });
      if (initialData.requested_unit && !ALLOWED_UNITS.includes(initialData.requested_unit)) {
        setIsCustomItem(true);
        setFormData(prev => ({
          ...prev,
          requested_unit: "__custom",
          custom_unit: initialData.requested_unit
        }));
      }
    }
  }, [initialData]);

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

    const finalUnit = formData.requested_unit === "__custom" 
      ? formData.custom_unit.trim() 
      : formData.requested_unit;

    const params = new URLSearchParams();
    params.append("item_name", formData.item_name.trim());
    params.append("quantity", Number(formData.quantity));
    params.append("requested_unit", finalUnit);

    try {
      await axios.post(`${API}/cart/add?${params.toString()}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      showMsg("✅ آئٹم کارٹ میں شامل کر دیا گیا", "success");
      // Only close form on SUCCESS
      setTimeout(() => onSave(), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "شامل کرنے میں ناکامی";
      showMsg(errorMsg, "error");
      setIsSubmitting(false);
      // ✅ DO NOT call onSave() here - form stays open on error
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold mb-6 border-r-4 border-green-600 pr-3 text-right">
        ➕ نیا نقد آئٹم شامل کریں
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Item Name with Dropdown */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
            آئٹم کا نام <span className="text-red-500">*</span>
          </label>
          
          {/* Toggle buttons */}
          {/* <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setIsCustomItem(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                !isCustomItem ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              📋 موجودہ آئٹم
            </button>
            <button
              type="button"
              onClick={() => setIsCustomItem(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                isCustomItem ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              ✨ نیا آئٹم لکھیں
            </button>
          </div> */}
          
          {!isCustomItem ? (
            <div>
              <select
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                className={`w-full p-3 border-2 rounded-xl outline-none text-right text-base ${
                  errors.item_name ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-green-500"
                }`}
                disabled={itemsLoading}
              >
                <option value="">-- آئٹم منتخب کریں --</option>
                {availableItems.map(item => (
                  <option key={item.item_id} value={item.item_name}>
                    {item.item_name} ({item.stock_quantity} {item.item_unit} باقی)
                  </option>
                ))}
              </select>
              {itemsLoading && <p className="text-gray-400 text-sm mt-1 text-right">آئٹمز لوڈ ہو رہے ہیں...</p>}
              {availableItems.length === 0 && !itemsLoading && (
                <p className="text-amber-600 text-sm mt-1 text-right">⚠️ کوئی آئٹم موجود نہیں ہے۔ پہلے "آئٹمز" مینو سے آئٹم شامل کریں</p>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className={`w-full p-3 border-2 rounded-xl outline-none transition-all text-right text-base ${
                errors.item_name ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-green-500"
              }`}
              placeholder="مثال: انڈے، دودھ، چاول"
            />
          )}
          {errors.item_name && <p className="text-red-600 text-sm mt-1 text-right">{errors.item_name}</p>}
        </div>

        {/* Quantity and Unit */}
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
                errors.quantity ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-green-500"
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
                errors.requested_unit ? "border-red-500" : "border-gray-200 focus:border-green-500"
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
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-right text-base outline-none focus:border-green-500"
              placeholder="مثال: پیالی، تھیلا"
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-base hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>شامل ہو رہا ہے...</span>
              </>
            ) : (
              "🛒 کارٹ میں شامل کریں"
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