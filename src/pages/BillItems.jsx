import axios from "axios";
import { useState, useEffect, useCallback } from "react";

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
  const [showForm, setShowForm] = useState(false);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [showBillPreview, setShowBillPreview] = useState(null);
  const [shopInfo, setShopInfo] = useState({ shop_name: "360 آسان اسٹور", owner_name: "", address: "" });
  const [user, setUser] = useState(null);

  const [availableItems, setAvailableItems] = useState([]);
  const [filteredAvailableItems, setFilteredAvailableItems] = useState([]);
  const [availableItemsSearch, setAvailableItemsSearch] = useState("");
  const [itemsLoading, setItemsLoading] = useState(false);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const showMsg = useCallback((text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, getAuthHeader());
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  }, [API]);

  const fetchShopInfo = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/shops/`, getAuthHeader());
      if (res.data?.length > 0) setShopInfo(res.data[0]);
    } catch { }
  }, [API]);

  const fetchAvailableItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const res = await axios.get(`${API}/items`, getAuthHeader());
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setAvailableItems(data);
      setFilteredAvailableItems(data);
    } catch (err) {
      console.error("Failed to fetch items", err);
      showMsg("آئٹمز لوڈ کرنے میں خرابی", "error");
    } finally {
      setItemsLoading(false);
    }
  }, [API, showMsg]);

  const fetchCartFromBackend = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/cart/items`, getAuthHeader());

      let itemsArray = [];
      if (response.data && Array.isArray(response.data)) {
        itemsArray = response.data;
      } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
        itemsArray = response.data.items;
      }

      const loadedItems = itemsArray.map(item => ({
        cart_item_id: item.cart_item_id || item.billitem_id || item.id,
        item_name: item.item_name,
        quantity: item.quantity,
        requested_unit: item.requested_unit,
        unit_price: item.unit_price || 0,
        item_unit: item.item_unit,
        total_amount: item.total_amount || 0,
        base_quantity: item.base_quantity || 0
      }));

      setCartItems(loadedItems);
      setFilteredItems(loadedItems);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setCartItems([]);
      setFilteredItems([]);
    }
  }, [API]);

  const handleAddToCart = useCallback(async (item, customUnit = null, customQuantity = 1) => {
    setLoading(true);
    try {
      const requestedUnit = customUnit || item.item_unit;
      const quantity = customQuantity;

      const existingItem = cartItems.find(
        cartItem => cartItem.item_name.toLowerCase() === item.item_name.toLowerCase() &&
          cartItem.requested_unit === requestedUnit
      );

      if (existingItem) {
        showMsg(`⚠️ ${item.item_name} (${requestedUnit}) پہلے سے کارٹ میں موجود ہے`, "error");
        setLoading(false);
        return;
      }

      await axios.post(`${API}/cart/add`, null, {
        params: {
          item_name: item.item_name,
          quantity: quantity,
          requested_unit: requestedUnit
        },
        ...getAuthHeader()
      });
      showMsg(`✅ ${item.item_name} (${requestedUnit}) کارٹ میں شامل کر دیا گیا`, "success");

      await fetchCartFromBackend();
      if (onItemAdded) onItemAdded();
    } catch (err) {
      console.error("Failed to add to cart:", err);
      showMsg(err.response?.data?.detail || "کارٹ میں شامل کرنے میں خرابی", "error");
    } finally {
      setLoading(false);
    }
  }, [cartItems, API, showMsg, fetchCartFromBackend, onItemAdded]);

  const handleIncrement = useCallback(async (item) => {
    if (!item.cart_item_id) {
      showMsg(`❌ ${item.item_name} کی ID نہیں مل سکی`, "error");
      return;
    }

    setLoading(true);
    try {
      const newQuantity = item.quantity + 1;

      await axios.put(`${API}/cart/item/${item.cart_item_id}`, {
        quantity: newQuantity,
        requested_unit: item.requested_unit
      }, getAuthHeader());

      await fetchCartFromBackend();
      showMsg(`✅ ${item.item_name} کی تعداد ${newQuantity} ${item.requested_unit} کر دی گئی`, "success");
    } catch (err) {
      console.error("Increment error:", err);
      showMsg(err.response?.data?.detail || "اپڈیٹ کرنے میں خرابی", "error");
    } finally {
      setLoading(false);
    }
  }, [API, showMsg, fetchCartFromBackend]);

  const handleDecrement = useCallback(async (item) => {
    if (!item.cart_item_id) {
      showMsg(`❌ ${item.item_name} کی ID نہیں مل سکی`, "error");
      return;
    }

    setLoading(true);
    try {
      if (item.quantity <= 1) {
        await axios.delete(`${API}/cart/item/${item.cart_item_id}`, getAuthHeader());
        showMsg(`✅ ${item.item_name} (${item.requested_unit}) کارٹ سے حذف کر دیا گیا`, "success");
      } else {
        const newQuantity = item.quantity - 1;

        await axios.put(`${API}/cart/item/${item.cart_item_id}`, {
          quantity: newQuantity,
          requested_unit: item.requested_unit
        }, getAuthHeader());

        showMsg(`✅ ${item.item_name} کی تعداد ${newQuantity} ${item.requested_unit} کر دی گئی`, "success");
      }

      await fetchCartFromBackend();
    } catch (err) {
      console.error("Decrement error:", err);
      showMsg(err.response?.data?.detail || "اپڈیٹ کرنے میں خرابی", "error");
    } finally {
      setLoading(false);
    }
  }, [API, showMsg, fetchCartFromBackend]);

  const handleRemoveFromCart = useCallback(async (item) => {
    if (!item.cart_item_id) {
      showMsg(`❌ ${item.item_name} کی ID نہیں مل سکی`, "error");
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API}/cart/item/${item.cart_item_id}`, getAuthHeader());
      await fetchCartFromBackend();
      showMsg(`✅ ${item.item_name} (${item.requested_unit}) کارٹ سے حذف کر دیا گیا`, "success");
    } catch (err) {
      console.error("Remove error:", err);
      showMsg(err.response?.data?.detail || "حذف کرنے میں خرابی", "error");
    } finally {
      setLoading(false);
    }
  }, [API, showMsg, fetchCartFromBackend]);

  const addCustomItemToCart = useCallback(async (formData) => {
    const finalUnit = formData.requested_unit;
    const itemName = formData.item_name;
    const quantity = Number(formData.quantity);

    const existingItemInDB = availableItems.find(
      item => item.item_name === itemName
    );

    if (!existingItemInDB) {
      showMsg(`❌ "${itemName}" موجود نہیں ہے`, "error");
      throw new Error("Item not found");
    }

    const existingInCart = cartItems.find(
      cartItem => cartItem.item_name === itemName &&
        cartItem.requested_unit === finalUnit
    );

    if (existingInCart) {
      showMsg(`⚠️ ${itemName} (${finalUnit}) پہلے سے کارٹ میں موجود ہے`, "error");
      throw new Error("Item already in cart");
    }

    try {
      await axios.post(`${API}/cart/add`, null, {
        params: {
          item_name: itemName,
          quantity: quantity,
          requested_unit: finalUnit
        },
        ...getAuthHeader()
      });
      showMsg(`✅ ${itemName} (${finalUnit}) کارٹ میں شامل کر دیا گیا`, "success");
      await fetchCartFromBackend();
      if (onItemAdded) onItemAdded();
      return true;
    } catch (err) {
      console.error("Failed to add to cart:", err);
      const errorMsg = err.response?.data?.detail || "کارٹ میں شامل کرنے میں خرابی";
      showMsg(errorMsg, "error");
      throw new Error(errorMsg);
    }
  }, [availableItems, cartItems, API, showMsg, fetchCartFromBackend, onItemAdded]);

  const handleClearCart = useCallback(async () => {
    if (cartItems.length === 0) {
      showMsg("کارٹ پہلے سے خالی ہے", "error");
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API}/cart/clear`, getAuthHeader());
      await fetchCartFromBackend();
      showMsg("✅ کارٹ خالی کر دیا گیا", "success");
      if (onItemAdded) onItemAdded();
    } catch (err) {
      console.error("Clear cart error:", err);
      showMsg("کارٹ خالی کرنے میں خرابی", "error");
    } finally {
      setLoading(false);
    }
  }, [cartItems.length, API, showMsg, fetchCartFromBackend, onItemAdded]);

  const handleGenerateBill = useCallback(async () => {
    if (cartItems.length === 0) {
      showMsg("❌ کارٹ خالی ہے - پہلے آئٹمز شامل کریں", "error");
      return;
    }

    setGeneratingBill(true);

    try {
      const response = await axios.post(`${API}/cart/generate-bill`, {}, getAuthHeader());

      if (response.data) {
        const savedBill = response.data;
        const totalCartAmount = cartItems.reduce((sum, item) => sum + (item.total_amount || 0), 0);

        const now = new Date();
        const billData = {
          bill_id: savedBill.bill_id || Math.floor(Math.random() * 1000000),
          customer_name: savedBill.customer_name || "نقد",
          bill_day: savedBill.bill_day || now.getDate(),
          bill_month: savedBill.bill_month || now.toLocaleString('ur', { month: 'long' }),
          bill_year: savedBill.bill_year || now.getFullYear(),
          bill_time: savedBill.bill_time || now.toLocaleTimeString('ur-PK'),
          bill_day_name: savedBill.bill_day_name || now.toLocaleDateString('ur-PK', { weekday: 'long' }),
          items: cartItems.map(item => ({
            item_name: item.item_name,
            quantity: item.quantity,
            requested_unit: item.requested_unit,
            unit_price: (item.total_amount / item.quantity).toFixed(2),
            total_amount: item.total_amount
          })),
          total_amount: totalCartAmount
        };

        setShowBillPreview(billData);
        showMsg("✅ بل کامیابی سے جنریٹ اور محفوظ ہو گیا", "success");

        setCartItems([]);
        setFilteredItems([]);

        if (onItemAdded) onItemAdded();
      } else {
        showMsg("❌ بل جنریٹ کرنے میں خرابی", "error");
      }
    } catch (err) {
      console.error("Bill generation failed:", err);
      const errorMsg = err.response?.data?.detail || "بل جنریٹ کرنے میں خرابی";
      showMsg(`❌ ${errorMsg}`, "error");
    } finally {
      setGeneratingBill(false);
    }
  }, [cartItems, API, showMsg, onItemAdded]);

  const handlePrintBill = useCallback((billData) => {
    const escapeHtml = (text) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeWindow = iframe.contentWindow;
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

    iframeDocument.open();
    iframeDocument.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>نقد بل - ${billData.bill_id}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            line-height: 1.6;
            background: #fff;
            color: #333;
          }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 20px; }
          .shop-name { font-size: 24px; font-weight: bold; color: #10b981; margin-bottom: 8px; }
          .shop-address { color: #666; font-size: 12px; }
          .bill-title { text-align: center; margin: 20px 0; font-size: 20px; font-weight: bold; color: #333; }
          .bill-info { display: flex; justify-content: space-between; margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; flex-wrap: wrap; gap: 10px; }
          .info-group { text-align: center; flex: 1; }
          .info-label { font-size: 11px; color: #666; margin-bottom: 3px; }
          .info-value { font-size: 14px; font-weight: bold; color: #333; }
          .items-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
          .items-table th, .items-table td { padding: 10px; border-bottom: 1px solid #eee; text-align: center; }
          .items-table th { background: #f5f5f5; font-weight: bold; border-bottom: 2px solid #ddd; }
          .items-table td:first-child { text-align: right; }
          .total-box { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
          .total-label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
          .total-value { font-size: 32px; font-weight: bold; }
          .footer { text-align: center; margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; color: #999; font-size: 11px; }
          @media print { body { padding: 0; margin: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${escapeHtml(shopInfo.shop_name) || "360 آسان اسٹور"}</div>
          <div class="shop-address">${escapeHtml(shopInfo.address) || ""}</div>
          <div class="shop-address">مالک: ${escapeHtml(shopInfo.owner_name) || escapeHtml(user?.username) || ""}</div>
        </div>
        <div class="bill-title">💰 نقد بل</div>
        <div class="bill-info">
          <div class="info-group"><div class="info-label">بل نمبر</div><div class="info-value">#${billData.bill_id}</div></div>
          <div class="info-group"><div class="info-label">کسٹمر</div><div class="info-value">${escapeHtml(billData.customer_name) || "نقد"}</div></div>
          <div class="info-group"><div class="info-label">تاریخ</div><div class="info-value">${escapeHtml(billData.bill_day_name)}، ${billData.bill_day} ${escapeHtml(billData.bill_month)} ${billData.bill_year}</div></div>
          <div class="info-group"><div class="info-label">وقت</div><div class="info-value">${billData.bill_time}</div></div>
        </div>
        <table class="items-table">
          <thead><tr><th>آئٹم</th><th>مقدار</th><th>اکائی</th><th>فی اکائی (Rs.)</th><th>کل (Rs.)</th></tr></thead>
          <tbody>
            ${billData.items?.map(item => `
              <tr>
                <td style="text-align:right">${escapeHtml(item.item_name)}</td>
                <td style="text-align:center">${item.quantity}</td>
                <td style="text-align:center">${escapeHtml(item.requested_unit)}</td>
                <td style="text-align:center">${item.unit_price}</td>
                <td style="text-align:center">${item.total_amount}</td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="text-align:center">کوئی آئٹم نہیں</td><td style="text-align:center">0</td></tr>'}
          </tbody>
        </table>
        <div class="total-box">
          <div class="total-label">کل قابل ادائیگی</div>
          <div class="total-value">${billData.total_amount?.toLocaleString()} روپے</div>
        </div>
        <div class="footer">شکریہ! دوبارہ تشریف لائیں۔</div>
        <div class="no-print" style="text-align:center; margin-top:20px;">
          <button onclick="window.print()" style="padding:10px 20px; margin:10px; cursor:pointer; background:#10b981; color:white; border:none; border-radius:8px;">🖨️ پرنٹ کریں</button>
          <button onclick="window.close()" style="padding:10px 20px; margin:10px; cursor:pointer; background:#ef4444; color:white; border:none; border-radius:8px;">✕ بند کریں</button>
        </div>
        <script>setTimeout(() => { window.print(); }, 500);</script>
      </body>
      </html>
    `);
    iframeDocument.close();
    iframeWindow.focus();

    const cleanup = () => {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    };

    iframeWindow.onafterprint = cleanup;
    setTimeout(cleanup, 30000);
  }, [shopInfo, user]);

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
  };

  const handleAvailableItemsSearch = (e) => {
    const searchTerm = e.target.value;
    setAvailableItemsSearch(searchTerm);
    if (!searchTerm.trim()) {
      setFilteredAvailableItems(availableItems);
    } else {
      const filtered = availableItems.filter(item =>
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAvailableItems(filtered);
    }
  };

  const handleAddNew = () => {
    setShowForm(true);
  };

  const handleFormClose = useCallback((shouldRefresh = false) => {
    setShowForm(false);
    if (shouldRefresh) {
      fetchCartFromBackend();
      if (onItemAdded) onItemAdded();
    }
  }, [fetchCartFromBackend, onItemAdded]);

  useEffect(() => {
    fetchShopInfo();
    fetchUser();
    fetchAvailableItems();
    fetchCartFromBackend();
  }, [fetchShopInfo, fetchUser, fetchAvailableItems, fetchCartFromBackend]);

  const totalCartAmount = cartItems.reduce((sum, item) => sum + (item.total_amount || 0), 0);
  const totalCartItems = cartItems.length;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-6" dir="rtl">
      {/* Message Toast - Higher z-index to show above modals */}
      {message.text && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[999] px-6 py-3 rounded-2xl shadow-2xl"
          style={{
            backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white'
          }}>
          <div className="flex items-center gap-2">
            <span>{message.type === 'success' ? '✅' : '❌'}</span>
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

              <div className="overflow-x-auto">
                <table className="w-full text-right mb-6 border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 border">آئٹم</th>
                      <th className="p-3 border text-center">مقدار</th>
                      <th className="p-3 border text-center">اکائی</th>
                      <th className="p-3 border text-center">قیمت/اکائی</th>
                      <th className="p-3 border text-center">کل رقم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showBillPreview.items?.map((item, idx) => (
                      <tr key={`${item.item_name}-${idx}`} className="border-b hover:bg-gray-50">
                        <td className="p-3 border text-right">{item.item_name}</td>
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
              </div>

              <div className="flex gap-3">
                <button onClick={() => {
                  setShowBillPreview(null);
                  handlePrintBill(showBillPreview);
                }} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md">
                  🖨️ پرنٹ بل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN - Available Items */}
        <div className="lg:w-1/3 bg-white rounded-2xl shadow-xl overflow-hidden h-fit border border-gray-100">
          <div className="p-5 border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <h2 className="text-xl font-bold text-gray-800 font-urdu flex items-center gap-2">
              <span className="text-2xl">➕</span> آئٹم شامل کریں
            </h2>
            <p className="text-gray-500 text-sm mt-1">کارٹ میں شامل کرنے کے لیے آئٹم پر کلک کریں</p>
          </div>

          <div className="p-4">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="🔍 آئٹم نام سے تلاش کریں..."
                value={availableItemsSearch}
                onChange={handleAvailableItemsSearch}
                className="w-full p-3 pr-10 border-2 border-gray-200 rounded-xl bg-white focus:border-green-500 focus:outline-none transition-all text-sm font-urdu text-right"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {itemsLoading ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 mt-2">لوڈ ہو رہا ہے...</p>
                </div>
              ) : filteredAvailableItems.length > 0 ? (
                filteredAvailableItems.map((item) => (
                  <button
                    key={item.item_id}
                    onClick={() => handleAddToCart(item)}
                    disabled={loading}
                    className="w-full text-right p-4 border rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all flex justify-between items-center group shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    <div className="text-right">
                      <span className="font-bold text-gray-800 text-lg block">{item.item_name}</span>
                      <span className="text-gray-500 text-sm">{item.item_unit} | قیمت فی {item.item_unit}: Rs. {item.unit_price}</span>
                    </div>
                    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-all text-sm font-bold">
                      🛒 کارٹ میں ڈالیں
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <span className="text-4xl block mb-2">🔍</span>
                  <span>کوئی آئٹم موجود نہیں ہے</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={handleAddNew}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span className="text-lg">+</span> نیا نقد آئٹم (دستی)
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN - Cart */}
        <div className="lg:w-2/3 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-urdu flex items-center gap-2">
                  <span className="text-2xl">🛒</span> کارٹ ({totalCartItems} آئٹمز)
                </h2>
                <p className="text-gray-600 text-sm mt-1 font-bold">کل رقم: Rs. {totalCartAmount.toLocaleString()}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClearCart}
                  disabled={cartItems.length === 0 || loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
                >
                  🗑️ کارٹ خالی کریں
                </button>
                <button
                  onClick={handleGenerateBill}
                  disabled={generatingBill || cartItems.length === 0}
                  className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-md ${cartItems.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    }`}
                >
                  {generatingBill ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>بل بن رہا ہے...</span></> : "🧾 بل جنریٹ کریں"}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 border-b bg-gray-50">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 کارٹ میں آئٹم نام سے تلاش کریں..."
                value={search}
                onChange={handleSearchChange}
                className="w-full p-3 pr-10 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:outline-none transition-all text-sm font-urdu text-right"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="p-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-5xl">🛒</div>
                  <p className="text-gray-500 text-lg font-medium">کارٹ خالی ہے۔ بائیں جانب سے آئٹم شامل کریں</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-right min-w-[700px]">
                <thead className="bg-gray-100 border-b sticky top-0">
                  <tr>
                    <th className="p-4 font-bold text-gray-700 text-base">آئٹم نام</th>
                    <th className="p-4 font-bold text-gray-700 text-center text-base">مقدار</th>
                    <th className="p-4 font-bold text-gray-700 text-center text-base">اکائی</th>
                    <th className="p-4 font-bold text-gray-700 text-center text-base">فی اکائی (Rs.)</th>
                    <th className="p-4 font-bold text-gray-700 text-center text-base">کل (Rs.)</th>
                    <th className="p-4 text-center font-bold text-gray-700 text-base">انتخاب</th>
                  </tr>
                </thead>
                <tbody>
                  {(search ? filteredItems : cartItems).map((item) => {
                    const pricePerUnit = (item.total_amount / item.quantity).toFixed(2);
                    return (
                      <tr key={item.cart_item_id} className="border-b hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 font-bold text-gray-800 text-right">{item.item_name}</td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDecrement(item)}
                              disabled={loading}
                              className="w-9 h-9 rounded-full bg-red-100 text-red-600 font-bold text-xl hover:bg-red-600 hover:text-white transition-all transform hover:scale-105 shadow-sm disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-lg w-14 text-center bg-gray-50 rounded-lg py-1">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleIncrement(item)}
                              disabled={loading}
                              className="w-9 h-9 rounded-full bg-green-100 text-green-600 font-bold text-xl hover:bg-green-600 hover:text-white transition-all transform hover:scale-105 shadow-sm disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-center text-gray-600 font-medium">{item.requested_unit}</td>
                        <td className="p-4 text-center font-mono text-blue-700 font-bold">
                          Rs. {parseFloat(pricePerUnit).toLocaleString()}
                        </td>
                        <td className="p-4 text-center font-bold text-green-700">Rs. {item.total_amount?.toLocaleString() || 0}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleRemoveFromCart(item)}
                            disabled={loading}
                            className="text-red-600 hover:text-white font-bold text-sm transition-all hover:bg-red-600 px-3 py-1.5 rounded-lg bg-red-50 hover:shadow-md disabled:opacity-50"
                          >
                            🗑️ حذف
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan="4" className="p-4 text-left font-bold text-lg">کل رقم:</td>
                    <td className="p-4 text-center font-bold text-xl text-green-700">Rs. {totalCartAmount.toLocaleString()}</td>
                    <tr>
                    </tr>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Manual Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[300] flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <BillItemForm
              onCancel={() => handleFormClose(false)}
              onSave={async (formData) => {
                await addCustomItemToCart(formData);
                handleFormClose(true);
              }}
              showMsg={showMsg}
              availableItems={availableItems}
              cartItems={cartItems}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// BillItemForm Component - With custom unit support
function BillItemForm({ onCancel, onSave, showMsg, availableItems, cartItems = [] }) {
  const [formData, setFormData] = useState({
    item_name: "",
    quantity: "",
    requested_unit: "",
    custom_unit: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemExists, setItemExists] = useState(null);
  const [matchingItem, setMatchingItem] = useState(null);
  const [formMessage, setFormMessage] = useState({ text: "", type: "" });
  const [useCustomUnit, setUseCustomUnit] = useState(false);

  useEffect(() => {
    if (formData.item_name) {
      const foundItem = availableItems.find(
        item => item.item_name === formData.item_name
      );
      setMatchingItem(foundItem);
      setItemExists(!!foundItem);

      if (foundItem) {
        // Check if item's unit is in allowed units list
        const isUnitAllowed = ALLOWED_UNITS.includes(foundItem.item_unit);

        if (isUnitAllowed) {
          setFormData(prev => ({
            ...prev,
            requested_unit: foundItem.item_unit,
            custom_unit: ""
          }));
          setUseCustomUnit(false);
        } else {
          // Item has custom unit not in the list
          setFormData(prev => ({
            ...prev,
            requested_unit: "",
            custom_unit: foundItem.item_unit
          }));
          setUseCustomUnit(true);
        }
        setFormMessage({ text: "", type: "" });
      }
    } else {
      setItemExists(null);
      setMatchingItem(null);
      setUseCustomUnit(false);
      setFormData(prev => ({ ...prev, requested_unit: "", custom_unit: "" }));
    }
  }, [formData.item_name, availableItems]);

  const validateForm = () => {
    let errs = {};

    if (!formData.item_name) {
      errs.item_name = "آئٹم کا نام منتخب کرنا ضروری ہے";
    } else if (!itemExists) {
      errs.item_name = `"${formData.item_name}" موجود نہیں ہے`;
    }

    if (!formData.quantity) {
      errs.quantity = "مقدار درج کرنا ضروری ہے";
    } else if (Number(formData.quantity) <= 0) {
      errs.quantity = "مقدار صفر سے زیادہ ہونی چاہیے";
    }

    // Validate unit (either selected from list or custom)
    const finalUnit = useCustomUnit ? formData.custom_unit : formData.requested_unit;
    if (!finalUnit?.trim()) {
      errs.requested_unit = "اکائی درج کریں یا منتخب کریں";
    }

    if (itemExists && finalUnit) {
      const existingInCart = cartItems.find(
        cartItem => cartItem.item_name === formData.item_name &&
          cartItem.requested_unit === finalUnit
      );
      if (existingInCart) {
        errs.requested_unit = `⚠️ ${formData.item_name} (${finalUnit}) پہلے سے کارٹ میں موجود ہے`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormMessage({ text: "", type: "" });

    const finalUnit = useCustomUnit ? formData.custom_unit : formData.requested_unit;

    const submissionData = {
      item_name: formData.item_name,
      quantity: Number(formData.quantity),
      requested_unit: finalUnit,
    };

    try {
      await onSave(submissionData);
    } catch (error) {
      console.error("Submission error:", error);
      setFormMessage({
        text: error.message || "شامل کرنے میں خرابی",
        type: "error"
      });
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formMessage.text) {
      setFormMessage({ text: "", type: "" });
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h3 className="text-2xl font-bold mb-6 border-r-4 border-green-600 pr-3 text-right">
        ➕ نیا نقد آئٹم شامل کریں
      </h3>

      {/* Form Error Message */}
      {formMessage.text && (
        <div className={`mb-4 p-3 rounded-xl text-center text-sm ${formMessage.type === "error" ? "bg-red-100 text-red-700 border border-red-200" : "bg-green-100 text-green-700"}`}>
          {formMessage.type === "error" ? "❌ " : "✅ "}{formMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
            آئٹم کا نام <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.item_name}
            onChange={(e) => handleFieldChange("item_name", e.target.value)}
            className={`w-full p-3 border-2 rounded-xl outline-none text-right text-base ${errors.item_name ? "border-red-500 bg-red-50" :
              itemExists === true ? "border-green-500 bg-green-50" :
                "border-gray-200 focus:border-green-500"
              }`}
          >
            <option value="">-- آئٹم منتخب کریں --</option>
            {availableItems.map(item => (
              <option key={item.item_id} value={item.item_name}>
                {item.item_name} - {item.item_unit} (Rs. {item.unit_price}) | اسٹاک: {item.stock_quantity}
              </option>
            ))}
          </select>
          {availableItems.length === 0 && (
            <p className="text-amber-600 text-sm mt-1 text-right">⚠️ پہلے "آئٹمز" مینو سے آئٹم شامل کریں</p>
          )}
          {itemExists === true && !errors.item_name && matchingItem && (
            <p className="text-green-600 text-sm mt-1 text-right">
              ✓ اسٹاک میں باقی: {matchingItem.stock_quantity} {matchingItem.item_unit}
              {!ALLOWED_UNITS.includes(matchingItem.item_unit) && (
                <span className="text-amber-600 block mt-1">⚠️ نوٹ: یہ آئٹم کی اکائی "{matchingItem.item_unit}" معیاری فہرست میں نہیں ہے، براہ کرم نیچے خود لکھیں</span>
              )}
            </p>
          )}
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
              onChange={(e) => handleFieldChange("quantity", e.target.value)}
              style={{ lineHeight: "normal", height: "auto" }}
              className={`w-full p-3 border-2 rounded-xl outline-none text-right text-base ${errors.quantity ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-green-500"
                }`}
              placeholder="مثال: 2.5"
            />
            {errors.quantity && <p className="text-red-600 text-sm mt-1 text-right">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
              اکائی <span className="text-red-500">*</span>
            </label>

            {!useCustomUnit && matchingItem && ALLOWED_UNITS.includes(matchingItem.item_unit) ? (
              // Show select dropdown for standard units
              <select
                value={formData.requested_unit}
                onChange={(e) => {
                  setUseCustomUnit(false);
                  handleFieldChange("requested_unit", e.target.value);
                }}
                disabled={!itemExists}
                style={{ lineHeight: "normal", height: "auto" }}
                className={`w-full p-3 border-2 rounded-xl outline-none text-right text-base ${errors.requested_unit ? "border-red-500" :
                  "border-gray-200 focus:border-green-500"
                  } ${!itemExists ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
              >
                <option value="">منتخب کریں</option>
                {ALLOWED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            ) : (
              // Show text input for custom unit
              <div className="space-y-2">
                <input
                  type="text"
                  value={useCustomUnit ? formData.custom_unit : (matchingItem?.item_unit || "")}
                  onChange={(e) => {
                    setUseCustomUnit(true);
                    handleFieldChange("custom_unit", e.target.value);
                  }}
                  disabled={!itemExists}
                  style={{ lineHeight: "normal", height: "auto" }}
                  className={`w-full p-3 border-2 rounded-xl outline-none text-right text-base ${errors.requested_unit ? "border-red-500" :
                    "border-gray-200 focus:border-green-500"
                    } ${!itemExists ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  placeholder="اپنی اکائی لکھیں (مثال: گٹھلی، جوڑی، تھیلی)"
                />
                {itemExists && ALLOWED_UNITS.includes(matchingItem?.item_unit) && (
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomUnit(false);
                      setFormData(prev => ({ ...prev, custom_unit: "", requested_unit: matchingItem?.item_unit || "" }));
                    }}
                    className="text-sm text-green-600 hover:text-green-700 text-right block w-full"
                  >
                    ↺ معیاری اکائی "{matchingItem?.item_unit}" استعمال کریں
                  </button>
                )}
                {itemExists && !ALLOWED_UNITS.includes(matchingItem?.item_unit) && (
                  <p className="text-blue-600 text-xs mt-1 text-right">💡 آپ یہاں اپنی مرضی کی کوئی بھی اکائی لکھ سکتے ہیں</p>
                )}
              </div>
            )}

            {errors.requested_unit && <p className="text-red-600 text-sm mt-1 text-right">{errors.requested_unit}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !itemExists}
            className={`flex-1 py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-md ${!itemExists ? "bg-gray-400 cursor-not-allowed" :
              "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              }`}
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