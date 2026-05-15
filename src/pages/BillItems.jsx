import axios from "axios";
import { useState, useEffect } from "react";
import VoiceInput from "../components/VoiceInput";
import { CartItemsVoiceService } from "../services/CartItemsVoiceService";

const API = import.meta.env.VITE_API_URL;

const ALLOWED_UNITS = [
  "کلو", "گرام", "پاؤ", "چھٹانک", "سیر", "من", "بوری",
  "لیٹر", "ملی لیٹر", "عدد", "درجن", "آدھا درجن",
  "پیکٹ", "ڈبہ", "بوتل"
];

// Local cart item structure
const createLocalCartItem = (item) => ({
  id: Date.now() + Math.random(),
  item_name: item.item_name,
  quantity: item.quantity || 1,
  requested_unit: item.requested_unit,
  unit_price: item.unit_price || 0,
  total_amount: (item.quantity || 1) * (item.unit_price || 0),
});

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

  // Voice related states
  const [showVoiceAddForm, setShowVoiceAddForm] = useState(false);
  const [voiceFormData, setVoiceFormData] = useState(null);
  const [voiceDeleteData, setVoiceDeleteData] = useState(null);

  // For "add items" section - REAL items from API
  const [availableItems, setAvailableItems] = useState([]);
  const [filteredAvailableItems, setFilteredAvailableItems] = useState([]);
  const [availableItemsSearch, setAvailableItemsSearch] = useState("");
  const [itemsLoading, setItemsLoading] = useState(false);

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
    } catch { }
  };

  // Fetch available items from API
  const fetchAvailableItems = async () => {
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
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const fetchCartItems = () => { return cartItems; };

  // Initialize voice service
  const [voiceService] = useState(() => new CartItemsVoiceService(showMsg, fetchCartItems));

  // Generate bill from cart (local preview only - no backend call)
  const handleGenerateBill = async () => {
    if (cartItems.length === 0) {
      showMsg("❌ کارٹ خالی ہے - پہلے آئٹمز شامل کریں", "error");
      return;
    }

    setGeneratingBill(true);

    // Create bill preview locally
    const now = new Date();
    const billData = {
      bill_id: Math.floor(Math.random() * 1000000),
      customer_name: "نقد",
      bill_day: now.getDate(),
      bill_month: now.toLocaleString('ur', { month: 'long' }),
      bill_year: now.getFullYear(),
      bill_time: now.toLocaleTimeString('ur-PK'),
      bill_day_name: now.toLocaleDateString('ur-PK', { weekday: 'long' }),
      items: cartItems.map(item => ({
        item_name: item.item_name,
        quantity: item.quantity,
        requested_unit: item.requested_unit,
        unit_price: item.unit_price,
        total_amount: item.total_amount
      })),
      total_amount: totalCartAmount
    };

    setShowBillPreview(billData);
    showMsg("✅ بل کامیابی سے جنریٹ ہو گیا", "success");
    setGeneratingBill(false);
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
            font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
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
              <tr><td style="text-align:right">${item.item_name}</td>
               <td>${item.quantity}</td>
               <td>${item.requested_unit}</td>
               <td>${item.unit_price}</td>
               <td>${item.total_amount}</td>
             </tr>
            `).join('') || ' etxek<td colspan="5">کوئی آئٹم نہیں</td></tr>'}
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
  };

  // Handle search for available items
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

  const handleClearCart = () => {
    if (cartItems.length === 0) {
      showMsg("کارٹ پہلے سے خالی ہے", "error");
      return;
    }
    setCartItems([]);
    setFilteredItems([]);
    showMsg("✅ کارٹ خالی کر دیا گیا", "success");
    if (onItemAdded) onItemAdded();
  };

  const handleAddNew = () => {
    setAutoFillFormData(null);
    setShowForm(true);
  };

  const handleFormClose = (shouldRefresh = false) => {
    setShowForm(false);
    setAutoFillFormData(null);
    if (shouldRefresh) {
      if (onItemAdded) onItemAdded();
    }
  };

  // New increment function - increases quantity by 1
  const handleIncrement = (item) => {
    const newQuantity = item.quantity + 1;
    const updatedCart = cartItems.map(cartItem =>
      cartItem.id === item.id
        ? {
          ...cartItem,
          quantity: newQuantity,
          total_amount: newQuantity * cartItem.unit_price
        }
        : cartItem
    );
    setCartItems(updatedCart);
    setFilteredItems(updatedCart);
    showMsg(`✅ ${item.item_name} کی تعداد ${newQuantity} کر دی گئی`, "success");
    if (onItemAdded) onItemAdded();
  };

  // New decrement function - decreases quantity by 1, removes if quantity becomes 0
  const handleDecrement = (item) => {
    if (item.quantity <= 1) {
      // Remove item if quantity is 1 and user tries to decrement
      const updatedCart = cartItems.filter(cartItem => cartItem.id !== item.id);
      setCartItems(updatedCart);
      setFilteredItems(updatedCart);
      showMsg(`✅ ${item.item_name} کارٹ سے حذف کر دیا گیا`, "success");
    } else {
      const newQuantity = item.quantity - 1;
      const updatedCart = cartItems.map(cartItem =>
        cartItem.id === item.id
          ? {
            ...cartItem,
            quantity: newQuantity,
            total_amount: newQuantity * cartItem.unit_price
          }
          : cartItem
      );
      setCartItems(updatedCart);
      setFilteredItems(updatedCart);
      showMsg(`✅ ${item.item_name} کی تعداد ${newQuantity} کر دی گئی`, "success");
    }
    if (onItemAdded) onItemAdded();
  };

  // Remove item from cart
  const handleRemoveFromCart = (item) => {
    const updatedCart = cartItems.filter(cartItem => cartItem.id !== item.id);
    setCartItems(updatedCart);
    setFilteredItems(updatedCart);
    showMsg(`✅ ${item.item_name} کارٹ سے حذف کر دیا گیا`, "success");
    if (onItemAdded) onItemAdded();
  };

  // Add to cart from available items - If already exists, increase quantity instead of creating duplicate
  const handleAddToCart = (item) => {
    const existingItem = cartItems.find(cartItem => cartItem.item_name === item.item_name);

    if (existingItem) {
      // Item already exists - increase quantity by 1
      const newQuantity = existingItem.quantity + 1;
      const updatedCart = cartItems.map(cartItem =>
        cartItem.id === existingItem.id
          ? {
            ...cartItem,
            quantity: newQuantity,
            total_amount: newQuantity * cartItem.unit_price
          }
          : cartItem
      );
      setCartItems(updatedCart);
      setFilteredItems(updatedCart);
      showMsg(`✅ ${item.item_name} کی تعداد بڑھا دی گئی (اب ${newQuantity})`, "success");
    } else {
      // Add new item with price from database
      const newItem = createLocalCartItem({
        item_name: item.item_name,
        requested_unit: item.item_unit || "عدد",
        quantity: 1,
        unit_price: item.unit_price || 0
      });
      const updatedCart = [...cartItems, newItem];
      setCartItems(updatedCart);
      setFilteredItems(updatedCart);
      showMsg(`✅ ${item.item_name} کارٹ میں شامل کر دیا گیا`, "success");
    }
    if (onItemAdded) onItemAdded();
  };

  // Add custom item from form with validation
  const addCustomItemToCart = async (formData) => {
    const finalUnit = formData.requested_unit === "__custom"
      ? formData.custom_unit
      : formData.requested_unit;

    // VALIDATION 1: Check if item exists in database
    const existingItemInDB = availableItems.find(
      item => item.item_name.toLowerCase() === formData.item_name.toLowerCase()
    );

    if (!existingItemInDB) {
      showMsg(`❌ "${formData.item_name}" موجود نہیں ہے - پہلے آئٹمز میں شامل کریں`, "error");
      return;
    }

    // VALIDATION 2: Check if unit matches the item's unit from database
    if (existingItemInDB.item_unit !== finalUnit) {
      showMsg(`❌ "${formData.item_name}" کی اکائی "${existingItemInDB.item_unit}" ہے - "${finalUnit}" نہیں`, "error");
      return;
    }

    // If validation passes, add to cart
    const existingItemInCart = cartItems.find(cartItem => cartItem.item_name === formData.item_name);

    if (existingItemInCart) {
      // Item already exists in cart - increase quantity
      const newQuantity = existingItemInCart.quantity + Number(formData.quantity);
      const updatedCart = cartItems.map(cartItem =>
        cartItem.id === existingItemInCart.id
          ? {
            ...cartItem,
            quantity: newQuantity,
            total_amount: newQuantity * existingItemInDB.unit_price
          }
          : cartItem
      );
      setCartItems(updatedCart);
      setFilteredItems(updatedCart);
      showMsg(`✅ ${formData.item_name} کی تعداد بڑھا دی گئی (اب ${newQuantity})`, "success");
    } else {
      // Add new item to cart
      const newItem = createLocalCartItem({
        item_name: formData.item_name,
        requested_unit: finalUnit,
        quantity: Number(formData.quantity),
        unit_price: existingItemInDB.unit_price
      });
      const updatedCart = [...cartItems, newItem];
      setCartItems(updatedCart);
      setFilteredItems(updatedCart);
      showMsg(`✅ ${formData.item_name} کارٹ میں شامل کر دیا گیا`, "success");
    }
    if (onItemAdded) onItemAdded();
  };

  // Voice command callbacks
  const voiceCallbacks = {
    onShowAddForm: (formData) => {
      setVoiceFormData(formData);
      setShowVoiceAddForm(true);
    },
    onShowDeleteConfirm: (deleteData) => {
      setVoiceDeleteData(deleteData);
    },
    onClearCart: () => {
      handleClearCart();
    },
    onBillAction: () => {
      handleGenerateBill();
    }
  };

  // Handle voice command received
  const handleVoiceCommand = async (commandData) => {
    await voiceService.processCommand(commandData, voiceCallbacks);
  };

  useEffect(() => {
    fetchShopInfo();
    fetchUser();
    fetchAvailableItems(); // Fetch real items from API
  }, []);

  const totalCartAmount = cartItems.reduce((sum, item) => sum + (item.total_amount || 0), 0);
  const totalCartItems = cartItems.length;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-6" dir="rtl">
      {/* Voice Input Component */}
      <VoiceInput
        onCommandReceived={handleVoiceCommand}
        onClose={() => { }}
        feature="cart"
      />

      {/* Message Toast with animation */}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-auto transform transition-all duration-300 scale-100">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">🧾 بل کی تفصیل</h2>
              <button onClick={() => setShowBillPreview(null)} className="text-gray-500 hover:text-gray-700 text-2xl transition-colors">✕</button>
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
                      <tr key={idx} className="border-b hover:bg-gray-50">
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
                <button onClick={() => printBill(showBillPreview)} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md">
                  🖨️ پرنٹ بل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Delete Confirmation Modal */}
      {voiceDeleteData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center transform transition-all duration-300 scale-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2">کیا آپ کو یقین ہے؟</h3>
            <p className="text-gray-500 text-sm mb-4">
              "{voiceDeleteData.name}" (مقدار: {voiceDeleteData.quantity} {voiceDeleteData.unit})
              <br />
              کارٹ سے ہمیشہ کے لیے حذف ہو جائے گا۔
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await voiceService.executeDelete(voiceDeleteData.id, voiceDeleteData.name);
                  setVoiceDeleteData(null);
                }}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all text-sm"
              >
                ہاں، حذف کریں
              </button>
              <button onClick={() => setVoiceDeleteData(null)} className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm">
                منسوخ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Add/Edit Form Modal */}
      {showVoiceAddForm && voiceFormData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <BillItemForm
              initialData={voiceFormData}
              onCancel={() => {
                setShowVoiceAddForm(false);
                setVoiceFormData(null);
              }}
              onSave={(formData) => {
                addCustomItemToCart(formData);
                setShowVoiceAddForm(false);
                setVoiceFormData(null);
              }}
              showMsg={showMsg}
              availableItems={availableItems}
            />
          </div>
        </div>
      )}

      {/* Main Layout: 2 Columns */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN: Add Items Section - Professional Design */}
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
                    className="w-full text-right p-4 border rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all flex justify-between items-center group shadow-sm hover:shadow-md"
                  >
                    <div className="text-right">
                      <span className="font-bold text-gray-800 text-lg block">{item.item_name}</span>
                      <span className="text-gray-500 text-sm">{item.item_unit} | قیمت: Rs. {item.unit_price}</span>
                    </div>
                    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-all text-sm font-bold">
                      🛒 کارٹ میں ڈالیں
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <span className="text-4xl block mb-2">🔍</span>
                  <span>
                    {availableItemsSearch
                      ? `"${availableItemsSearch}" کے نام سے کوئی آئٹم نہیں ملا`
                      : "کوئی آئٹم موجود نہیں ہے"}
                  </span>
                  {!availableItemsSearch && (
                    <button
                      onClick={fetchAvailableItems}
                      className="block mx-auto mt-4 text-green-600 hover:text-green-700 text-sm font-bold"
                    >
                      ↻ دوبارہ لوڈ کریں
                    </button>
                  )}
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

        {/* RIGHT COLUMN: Cart Section - Professional Design */}
        <div className="lg:w-2/3 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Cart Header */}
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
                  disabled={cartItems.length === 0}
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

          {/* Search for cart items */}
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

          {/* Cart Items List with Increment/Decrement buttons */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="p-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-5xl">🛒</div>
                  <p className="text-gray-500 text-lg font-medium">
                    {search ? `"${search}" کے نام سے کوئی آئٹم نہیں ملا` : "کارٹ خالی ہے۔ بائیں جانب سے آئٹم شامل کریں"}
                  </p>
                  {search && (
                    <button onClick={() => { setSearch(""); setFilteredItems(cartItems); }} className="text-green-600 hover:text-green-700 font-bold underline">
                      تمام آئٹمز دیکھیں
                    </button>
                  )}
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
                  {(search ? filteredItems : cartItems).map((item) => (
                    <tr key={item.id} className="border-b hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 font-bold text-gray-800 text-right">{item.item_name}</td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDecrement(item)}
                            className="w-9 h-9 rounded-full bg-red-100 text-red-600 font-bold text-xl hover:bg-red-600 hover:text-white transition-all transform hover:scale-105 shadow-sm"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-lg w-14 text-center bg-gray-50 rounded-lg py-1">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleIncrement(item)}
                            className="w-9 h-9 rounded-full bg-green-100 text-green-600 font-bold text-xl hover:bg-green-600 hover:text-white transition-all transform hover:scale-105 shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-center text-gray-600 font-medium">{item.requested_unit}</td>
                      <td className="p-4 text-center font-mono text-blue-700 font-bold">Rs. {item.unit_price?.toLocaleString() || 0}</td>
                      <td className="p-4 text-center font-bold text-green-700">Rs. {item.total_amount?.toLocaleString() || 0}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleRemoveFromCart(item)}
                          className="text-red-600 hover:text-white font-bold text-sm transition-all hover:bg-red-600 px-3 py-1.5 rounded-lg bg-red-50 hover:shadow-md"
                        >
                          🗑️ حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan="4" className="p-4 text-left font-bold text-lg">کل رقم:</td>
                    <td className="p-4 text-center font-bold text-xl text-green-700">Rs. {totalCartAmount.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Manual Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <BillItemForm
              initialData={autoFillFormData}
              onCancel={() => handleFormClose(false)}
              onSave={(formData) => {
                addCustomItemToCart(formData);
                handleFormClose(true);
              }}
              showMsg={showMsg}
              availableItems={availableItems}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== BillItemForm Component with Validation ========================
function BillItemForm({ initialData, onCancel, onSave, showMsg, availableItems }) {
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

  // Check if item exists in database when item_name changes
  useEffect(() => {
    if (formData.item_name.trim()) {
      const foundItem = availableItems.find(
        item => item.item_name.toLowerCase() === formData.item_name.toLowerCase()
      );
      setMatchingItem(foundItem);
      setItemExists(!!foundItem);

      // Auto-fill the unit if item exists
      if (foundItem && formData.requested_unit !== foundItem.item_unit) {
        setFormData(prev => ({
          ...prev,
          requested_unit: foundItem.item_unit,
          custom_unit: ""
        }));
        // Clear any previous unit error
        if (errors.requested_unit) {
          setErrors(prev => ({ ...prev, requested_unit: "" }));
        }
      }
    } else {
      setItemExists(null);
      setMatchingItem(null);
    }
  }, [formData.item_name, availableItems]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        item_name: initialData.item_name || "",
        quantity: initialData.quantity || "",
        requested_unit: initialData.requested_unit || "",
        custom_unit: initialData.custom_unit || ""
      });
      if (initialData.requested_unit && !ALLOWED_UNITS.includes(initialData.requested_unit)) {
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

    // Validate item name
    if (!formData.item_name.trim()) {
      errs.item_name = "آئٹم کا نام درج کرنا ضروری ہے";
    } else if (formData.item_name.length < 2) {
      errs.item_name = "آئٹم کا نام کم از کم 2 حروف کا ہونا چاہیے";
    } else if (!itemExists) {
      errs.item_name = `"${formData.item_name}" موجود نہیں ہے - پہلے آئٹمز میں شامل کریں`;
    }

    // Validate quantity
    if (!formData.quantity) {
      errs.quantity = "مقدار درج کرنا ضروری ہے";
    } else if (Number(formData.quantity) <= 0) {
      errs.quantity = "مقدار صفر سے زیادہ ہونی چاہیے";
    }

    // Validate unit
    const finalUnit = formData.requested_unit === "__custom" ? formData.custom_unit : formData.requested_unit;
    if (!finalUnit || !finalUnit.trim()) {
      errs.requested_unit = "اکائی منتخب کریں یا اپنی مرضی کی اکائی درج کریں";
    } else if (matchingItem && finalUnit !== matchingItem.item_unit) {
      errs.requested_unit = `"${formData.item_name}" کی صحیح اکائی "${matchingItem.item_unit}" ہے`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const finalUnit = formData.requested_unit === "__custom"
      ? formData.custom_unit.trim()
      : formData.requested_unit;

    const submissionData = {
      item_name: formData.item_name.trim(),
      quantity: Number(formData.quantity),
      requested_unit: finalUnit,
    };

    setTimeout(() => {
      onSave(submissionData);
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold mb-6 border-r-4 border-green-600 pr-3 text-right">
        {initialData?.mode === "EDIT" ? "✏️ آئٹم کی مقدار تبدیل کریں" : "➕ نیا نقد آئٹم شامل کریں"}
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
            className={`w-full p-3 border-2 rounded-xl outline-none transition-all text-right text-base ${errors.item_name ? "border-red-500 bg-red-50" :
                itemExists === true ? "border-green-500 bg-green-50" :
                  "border-gray-200 focus:border-green-500"
              }`}
            placeholder="مثال: انڈے، دودھ، چاول"
          />
          {itemExists === true && !errors.item_name && (
            <p className="text-green-600 text-sm mt-1 text-right">
              ✓ یہ آئٹم موجود ہے (اکائی: {matchingItem?.item_unit}, قیمت: Rs. {matchingItem?.unit_price})
            </p>
          )}
          {itemExists === false && !errors.item_name && formData.item_name.trim() && (
            <p className="text-red-600 text-sm mt-1 text-right">
              ✗ "{formData.item_name}" موجود نہیں ہے - پہلے آئٹمز میں شامل کریں
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
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
            <select
              value={formData.requested_unit}
              onChange={(e) => setFormData({ ...formData, requested_unit: e.target.value })}
              disabled={!itemExists}
              className={`w-full p-3 border-2 rounded-xl outline-none text-right text-base ${errors.requested_unit ? "border-red-500" :
                  "border-gray-200 focus:border-green-500"
                } ${!itemExists ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
            >
              <option value="">منتخب کریں</option>
              {ALLOWED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              <option value="__custom">✨ دیگر (اپنی مرضی کی)</option>
            </select>
            {matchingItem && !errors.requested_unit && formData.requested_unit && formData.requested_unit !== matchingItem.item_unit && formData.requested_unit !== "__custom" && (
              <p className="text-red-600 text-sm mt-1 text-right">
                ⚠️ "{formData.item_name}" کی اکائی "{matchingItem.item_unit}" ہے
              </p>
            )}
            {errors.requested_unit && <p className="text-red-600 text-sm mt-1 text-right">{errors.requested_unit}</p>}
            {!itemExists && formData.item_name.trim() && (
              <p className="text-amber-600 text-sm mt-1 text-right">
                ⚠️ پہلے درست آئٹم نام درج کریں
              </p>
            )}
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
            {matchingItem && formData.custom_unit && formData.custom_unit !== matchingItem.item_unit && (
              <p className="text-red-600 text-sm mt-1 text-right">
                ⚠️ "{formData.item_name}" کی صحیح اکائی "{matchingItem.item_unit}" ہے
              </p>
            )}
          </div>
        )}

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