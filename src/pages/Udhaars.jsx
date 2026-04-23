import { useState, useEffect } from "react";
import axios from "axios";
import VoiceInput from "../components/VoiceInput";
import { UdhaarVoiceService } from "../services/UdhaarVoiceService";

const API = import.meta.env.VITE_API_URL;

function Udhaars({ onItemAdded, onClose }) {
  const [udhars, setUdhars] = useState([]);
  const [filteredUdhars, setFilteredUdhars] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedUdhar, setSelectedUdhar] = useState(null);
  const [shopInfo, setShopInfo] = useState({ shop_name: "میرا اسٹور", owner_name: "", address: "" });
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState("created_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // Voice command form states
  const [showVoiceAdditionForm, setShowVoiceAdditionForm] = useState(false);
  const [showVoiceDeductionForm, setShowVoiceDeductionForm] = useState(false);
  const [voiceFormData, setVoiceFormData] = useState({ customer_name: "", amount: "" });
  const [voiceFormLoading, setVoiceFormLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form states for direct addition/deduction (manual)
  const [showAdditionForm, setShowAdditionForm] = useState(false);
  const [showDeductionForm, setShowDeductionForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ text: "", type: "" });

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, getAuthHeader());
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };

  const fetchUdhars = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/udhars/`, getAuthHeader());
      const data = res.data || [];
      setUdhars(data);
      setFilteredUdhars(data);
      setCurrentPage(1);
    } catch (err) {
      if (err.response?.status !== 404) {
        showMsg(err.response?.data?.detail || "کھاتہ لوڈ کرنے میں خرابی", "error");
      }
      setUdhars([]);
      setFilteredUdhars([]);
    } finally { 
      setLoading(false);
    }
  };

  const fetchShopInfo = async () => {
    try {
      const res = await axios.get(`${API}/shops/`, getAuthHeader());
      if (res.data?.length > 0) setShopInfo(res.data[0]);
    } catch {}
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  // ==================== VOICE COMMAND HANDLERS ====================
  
  const handleVoiceCommand = async (commandJson) => {
    console.log("Voice command received on Udhaar page:", commandJson);
    
    const voiceService = new UdhaarVoiceService(showMsg, fetchUdhars);
    
    await voiceService.processCommand(commandJson, {
      onShowUdhaarDetails: async (customerName) => {
        const foundUdhaar = udhars.find(u => 
          u.customer_name?.toLowerCase() === customerName.toLowerCase()
        );
        if (foundUdhaar) {
          setSelectedUdhar(foundUdhaar);
          showMsg(`👁️ "${customerName}" کا اُدھار دکھایا جا رہا ہے`, "success");
        } else {
          showMsg(`❌ "${customerName}" کا کوئی اُدھار نہیں ہے`, "error");
        }
      },
      onPrintUdhaar: async (customerName) => {
        const foundUdhaar = udhars.find(u => 
          u.customer_name?.toLowerCase() === customerName.toLowerCase()
        );
        if (foundUdhaar) {
          printUdhar(foundUdhaar);
          showMsg(`🖨️ "${customerName}" کا اُدھار پرنٹ کیا جا رہا ہے`, "success");
        } else {
          showMsg(`❌ "${customerName}" کا کوئی اُدھار نہیں ہے`, "error");
        }
      },
      onPayUdhaar: async (customerName) => {
        const foundUdhaar = udhars.find(u => 
          u.customer_name?.toLowerCase() === customerName.toLowerCase()
        );
        if (foundUdhaar && foundUdhaar.status === "unpaid") {
          await voiceService.executePay(customerName);
          await fetchUdhars();
          setSelectedUdhar(null);
        } else if (foundUdhaar && foundUdhaar.status === "paid") {
          showMsg(`✅ "${customerName}" کا اُدھار پہلے ہی ادا ہے`, "info");
        } else {
          showMsg(`❌ "${customerName}" کا کوئی اُدھار نہیں ہے`, "error");
        }
      },
      onDirectAddition: (formData) => {
        setVoiceFormData(formData);
        setShowVoiceAdditionForm(true);
      },
      onDirectDeduction: (formData) => {
        setVoiceFormData(formData);
        setShowVoiceDeductionForm(true);
      },
      onSearch: (searchTerm) => {
        setSearch(searchTerm);
        setStatusFilter("all");
        const filtered = udhars.filter(u => 
          (u.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUdhars(filtered);
        setCurrentPage(1);
        showMsg(`🔍 "${searchTerm}" تلاش کیا جا رہا ہے`, "success");
      },
      onShowAllUdhaar: () => {
        setSearch("");
        setStatusFilter("all");
        setFilteredUdhars(udhars);
        setCurrentPage(1);
        showMsg("📋 تمام کسٹمرز کے اُدھار دکھائے جا رہے ہیں", "success");
      },
      onOpenUdhaarPopup: () => {
        // Already on Udhaar page
      }
    });
  };

  // Execute voice addition
  const confirmVoiceAddition = async () => {
    setVoiceFormLoading(true);
    const voiceService = new UdhaarVoiceService(showMsg, fetchUdhars);
    await voiceService.executeDirectAddition(voiceFormData.customer_name, voiceFormData.amount);
    setShowVoiceAdditionForm(false);
    setVoiceFormData({ customer_name: "", amount: "" });
    setVoiceFormLoading(false);
    await fetchUdhars();
  };

  // Execute voice deduction
  const confirmVoiceDeduction = async () => {
    setVoiceFormLoading(true);
    const voiceService = new UdhaarVoiceService(showMsg, fetchUdhars);
    await voiceService.executeDirectDeduction(voiceFormData.customer_name, voiceFormData.amount);
    setShowVoiceDeductionForm(false);
    setVoiceFormData({ customer_name: "", amount: "" });
    setVoiceFormLoading(false);
    await fetchUdhars();
  };

  // ==================== EXISTING FUNCTIONS ====================

  const payUdhar = async (customerName) => {
    try {
      const response = await axios.post(`${API}/udhars/pay`, null, { 
        params: { customer_name: customerName }, 
        ...getAuthHeader() 
      });
      
      showMsg(response.data.message || "اُدھار کامیابی سے ادا کر دیا گیا", "success");
      await fetchUdhars();
      setSelectedUdhar(null);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "ادائیگی ناکام";
      showMsg(errorMsg, "error");
    }
  };

  const handleDirectAddition = async (e) => {
    e.preventDefault();
    setFormMessage({ text: "", type: "" });
    
    if (!selectedCustomer) {
      setFormMessage({ text: "براہ کرم کسٹمر نام منتخب کریں", type: "error" });
      return;
    }
    
    if (!amount || amount <= 0) {
      setFormMessage({ text: "براہ کرم صحیح رقم درج کریں (رقم صفر سے زیادہ ہونی چاہیے)", type: "error" });
      return;
    }
    
    setFormLoading(true);
    try {
      await axios.put(
        `${API}/udhars/${encodeURIComponent(selectedCustomer)}/direct-addition`,
        null,
        { params: { amount: parseFloat(amount) }, ...getAuthHeader() }
      );
      
      setShowAdditionForm(false);
      setSelectedCustomer("");
      setAmount("");
      setFormMessage({ text: "", type: "" });
      showMsg("✅ براہ راست جمع کامیابی سے شامل کر دی گئی", "success");
      await fetchUdhars();
    } catch (err) {
      setFormMessage({ text: err.response?.data?.detail || "جمع کرنے میں خرابی", type: "error" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDirectDeduction = async (e) => {
    e.preventDefault();
    setFormMessage({ text: "", type: "" });
    
    if (!selectedCustomer) {
      setFormMessage({ text: "براہ کرم کسٹمر نام منتخب کریں", type: "error" });
      return;
    }
    
    if (!amount || amount <= 0) {
      setFormMessage({ text: "براہ کرم صحیح رقم درج کریں (رقم صفر سے زیادہ ہونی چاہیے)", type: "error" });
      return;
    }
    
    setFormLoading(true);
    try {
      await axios.put(
        `${API}/udhars/${encodeURIComponent(selectedCustomer)}/direct-deduction`,
        null,
        { params: { amount: parseFloat(amount) }, ...getAuthHeader() }
      );
      
      setShowDeductionForm(false);
      setSelectedCustomer("");
      setAmount("");
      setFormMessage({ text: "", type: "" });
      showMsg("✅ براہ راست کٹوتی کامیابی سے کر دی گئی", "success");
      await fetchUdhars();
    } catch (err) {
      setFormMessage({ text: err.response?.data?.detail || "کٹوتی کرنے میں خرابی", type: "error" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUdhar = async () => {
    setDeleteError("");
    try {
      await axios.delete(`${API}/udhars/${deleteId}`, getAuthHeader());
      showMsg("✅ اُدھار کامیابی سے حذف کر دیا گیا", "success");
      setDeleteId(null);
      await fetchUdhars();
      if (onItemAdded) onItemAdded();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "حذف کرنے میں خرابی";
      setDeleteError(errorMsg);
    }
  };

  // Helper functions for date extraction
  const extractDayName = (dateUrdu) => {
    if (!dateUrdu) return "";
    const parts = dateUrdu.split("،");
    return parts[0] || "";
  };

  const extractDateParts = (dateUrdu) => {
    if (!dateUrdu) return { day: "", month: "", year: "" };
    const parts = dateUrdu.split("،");
    if (parts.length < 2) return { day: "", month: "", year: "" };
    const datePart = parts[1].trim();
    const dateParts = datePart.split(" ");
    if (dateParts.length >= 3) {
      return {
        day: dateParts[0],
        month: dateParts[1],
        year: dateParts[2]
      };
    }
    return { day: "", month: "", year: "" };
  };

  const printUdhar = (udhar) => {
    const dateParts = extractDateParts(udhar.created_date_urdu);
    const paidDateParts = udhar.paid_date_urdu ? extractDateParts(udhar.paid_date_urdu) : { day: "", month: "", year: "" };
    const dayName = extractDayName(udhar.created_date_urdu);
    const paidDayName = udhar.paid_date_urdu ? extractDayName(udhar.paid_date_urdu) : "";
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl"><head><title>اُدھار بل - ${udhar.customer_name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Arial', 'Tahoma', sans-serif;
          padding: 40px;
          line-height: 1.6;
          background: #fff;
          color: #333;
        }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #ddd; padding-bottom: 20px; }
        .shop-name { font-size: 28px; font-weight: bold; color: #d97706; margin-bottom: 10px; }
        .shop-address { color: #666; font-size: 14px; }
        .bill-info { display: flex; justify-content: space-between; margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 12px; flex-wrap: wrap; gap: 15px; }
        .info-group { text-align: center; flex: 1; }
        .info-label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .info-value { font-size: 16px; font-weight: bold; color: #333; }
        .amount-box { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; border-radius: 20px; text-align: center; margin: 30px 0; }
        .amount-label { font-size: 14px; opacity: 0.9; margin-bottom: 10px; }
        .amount-value { font-size: 48px; font-weight: bold; }
        .details-table { width: 100%; margin: 30px 0; border-collapse: collapse; }
        .details-table td { padding: 12px; border-bottom: 1px solid #eee; }
        .details-table td:first-child { font-weight: bold; color: #666; }
        .details-table td:last-child { text-align: left; font-weight: bold; }
        .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-unpaid { background: #fee2e2; color: #991b1b; }
        .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
        @media print { body { padding: 20px; } }
      </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${shopInfo.shop_name || "میرا اسٹور"}</div>
          <div class="shop-address">${shopInfo.address || ""}</div>
          <div class="shop-address">مالک: ${shopInfo.owner_name || user?.username || ""}</div>
        </div>

        <div class="bill-info">
          <div class="info-group"><div class="info-label">اُدھار نمبر</div><div class="info-value">#${udhar.udhar_id}</div></div>
          <div class="info-group"><div class="info-label">کسٹمر</div><div class="info-value">${udhar.customer_name}</div></div>
          <div class="info-group"><div class="info-label">تاریخ تخلیق</div><div class="info-value">${dayName}، ${dateParts.day} ${dateParts.month} ${dateParts.year}</div></div>
          <div class="info-group"><div class="info-label">وقت</div><div class="info-value">${udhar.udhar_time || udhar.created_time || "—"}</div></div>
        </div>

        ${udhar.status === "paid" ? `
        <div class="bill-info" style="background: #d1fae5;">
          <div class="info-group"><div class="info-label">ادا شدہ تاریخ</div><div class="info-value">${paidDayName}، ${paidDateParts.day} ${paidDateParts.month} ${paidDateParts.year}</div></div>
          <div class="info-group"><div class="info-label">ادا شدہ وقت</div><div class="info-value">${udhar.paid_time || "—"}</div></div>
        </div>
        ` : ''}

        <div class="amount-box">
          <div class="amount-label">کل واجب الادا رقم</div>
          <div class="amount-value">${udhar.total?.toLocaleString()} روپے</div>
        </div>

        <table class="details-table">
          <tr><td style="text-align: right">سب ٹوٹل:</td><td style="text-align: left">${udhar.subtotal?.toLocaleString()} روپے</td></tr>
          <tr><td style="text-align: right">براہ راست جمع:</td><td style="text-align: left; color: #10b981">+ ${udhar.direct_addition?.toLocaleString()} روپے</td></tr>
          <tr><td style="text-align: right">براہ راست کٹوتی:</td><td style="text-align: left; color: #ef4444">- ${udhar.direct_deduction?.toLocaleString()} روپے</td></tr>
          <tr><td style="text-align: right">اسٹیٹس:</td><td style="text-align: left"><span class="status ${udhar.status === 'paid' ? 'status-paid' : 'status-unpaid'}">${udhar.status === "paid" ? "ادا شدہ" : "غیر ادا شدہ"}</span></td></tr>
        </table>

        <div class="footer">شکریہ! آپ کا اعتبار ہماری ترجیح ہے۔</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  useEffect(() => {
    fetchUdhars();
    fetchShopInfo();
    fetchUser();
  }, []);

  const applyFiltersAndSort = () => {
    let filtered = [...udhars];
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(u => u.status === statusFilter);
    }
    
    if (search) {
      filtered = filtered.filter(u => 
        (u.customer_name || "").toLowerCase().includes(search.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === "customer") {
        aVal = a.customer_name;
        bVal = b.customer_name;
      } else if (sortBy === "total") {
        aVal = a.total;
        bVal = b.total;
      } else if (sortBy === "created_date") {
        aVal = a.created_date || "";
        bVal = b.created_date || "";
      } else if (sortBy === "paid_date") {
        const aPaid = a.status === "paid" ? (a.paid_date || "9999-12-31") : "9999-12-31";
        const bPaid = b.status === "paid" ? (b.paid_date || "9999-12-31") : "9999-12-31";
        aVal = aPaid;
        bVal = bPaid;
      } else {
        aVal = a[sortBy];
        bVal = b[sortBy];
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredUdhars(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    applyFiltersAndSort();
  }, [udhars, statusFilter, search, sortBy, sortOrder]);

  const handleFilter = (filter) => {
    setStatusFilter(filter);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFiltersAndSort();
  };

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(newOrder);
  };

  const getEmptyMessage = () => {
    if (search) return `"${search}" کے نام سے کوئی کسٹمر نہیں ملا`;
    if (statusFilter === "paid") return "کوئی ادا شدہ اُدھار موجود نہیں ہے";
    if (statusFilter === "unpaid") return "کوئی غیر ادا شدہ اُدھار موجود نہیں ہے";
    return "کوئی اُدھار موجود نہیں ہے";
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUdhars.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUdhars.length / itemsPerPage);

  return (
    <div className="relative min-h-screen bg-gray-50 p-3 md:p-6" dir="rtl">
      {/* Voice Input Component - WITH udhaar FEATURE */}
      <VoiceInput onCommandReceived={handleVoiceCommand} feature="udhaar" />

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

      {/* Voice Addition Form Modal */}
      {showVoiceAdditionForm && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <h3 className="text-2xl font-black mb-6 text-center text-green-600">💰 براہ راست جمع کریں (وائس کمانڈ)</h3>
            <div className="mb-4 p-4 bg-green-50 rounded-2xl text-right border border-green-200">
              <p className="text-lg"><strong className="text-green-700">کسٹمر:</strong> <span className="font-bold">{voiceFormData.customer_name}</span></p>
              <p className="text-lg mt-2"><strong className="text-green-700">رقم:</strong> <span className="font-bold text-green-600">{voiceFormData.amount} روپے</span></p>
            </div>
            <div className="flex gap-4">
              <button onClick={confirmVoiceAddition} disabled={voiceFormLoading} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-all">
                {voiceFormLoading ? "جمع کر رہا ہے..." : "✅ تصدیق کریں"}
              </button>
              <button onClick={() => { setShowVoiceAdditionForm(false); setVoiceFormData({ customer_name: "", amount: "" }); }} className="flex-1 bg-gray-200 py-4 rounded-2xl font-bold text-lg hover:bg-gray-300 transition-all">
                ❌ منسوخ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Deduction Form Modal */}
      {showVoiceDeductionForm && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <h3 className="text-2xl font-black mb-6 text-center text-red-600">✂️ براہ راست کٹوتی کریں (وائس کمانڈ)</h3>
            <div className="mb-4 p-4 bg-red-50 rounded-2xl text-right border border-red-200">
              <p className="text-lg"><strong className="text-red-700">کسٹمر:</strong> <span className="font-bold">{voiceFormData.customer_name}</span></p>
              <p className="text-lg mt-2"><strong className="text-red-700">رقم:</strong> <span className="font-bold text-red-600">{voiceFormData.amount} روپے</span></p>
            </div>
            <div className="flex gap-4">
              <button onClick={confirmVoiceDeduction} disabled={voiceFormLoading} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all">
                {voiceFormLoading ? "کٹوتی کر رہا ہے..." : "✂️ تصدیق کریں"}
              </button>
              <button onClick={() => { setShowVoiceDeductionForm(false); setVoiceFormData({ customer_name: "", amount: "" }); }} className="flex-1 bg-gray-200 py-4 rounded-2xl font-bold text-lg hover:bg-gray-300 transition-all">
                ❌ منسوخ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Addition Form Modal */}
      {showAdditionForm && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <h3 className="text-2xl font-black mb-6 text-center text-green-600">💰 براہ راست جمع کریں</h3>
            {formMessage.text && formMessage.type === "error" && (
              <div className="mb-4 p-3 rounded-xl text-center bg-red-100 text-red-700">❌ {formMessage.text}</div>
            )}
            <form onSubmit={handleDirectAddition}>
              <div className="mb-4">
  <label className="block text-sm font-bold mb-2 text-right">کسٹمر کا نام *</label>
  <input 
    type="text"
    list="customer-list"
    value={selectedCustomer}
    onChange={(e) => setSelectedCustomer(e.target.value)}
    placeholder="موجودہ کسٹمر منتخب کریں یا نیا نام لکھیں"
    className="w-full p-4 border-2 rounded-2xl text-right focus:border-green-500 outline-none"
    required
  />
  <datalist id="customer-list">
    {udhars.map(u => <option key={u.udhar_id} value={u.customer_name} />)}
  </datalist>
  <p className="text-xs text-gray-500 mt-1 text-right">💡 آپ موجودہ کسٹمر منتخب کر سکتے ہیں یا نیا نام لکھ سکتے ہیں</p>
</div>
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2 text-right">رقم (روپے میں) *</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مثلاً: 500" className="w-full p-4 border-2 rounded-2xl text-right focus:border-green-500 outline-none" required />
              </div>
              <div className="flex gap-4">
                <button type="submit" disabled={formLoading} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all">{formLoading ? "جمع کر رہا ہے..." : "✅ جمع کریں"}</button>
                <button type="button" onClick={() => { setShowAdditionForm(false); setSelectedCustomer(""); setAmount(""); }} className="flex-1 bg-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-300 transition-all">❌ منسوخ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Deduction Form Modal */}
      {showDeductionForm && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <h3 className="text-2xl font-black mb-6 text-center text-red-600">✂️ براہ راست کٹوتی کریں</h3>
            {formMessage.text && formMessage.type === "error" && (
              <div className="mb-4 p-3 rounded-xl text-center bg-red-100 text-red-700">❌ {formMessage.text}</div>
            )}
            <form onSubmit={handleDirectDeduction}>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2 text-right">کسٹمر کا نام *</label>
                <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="w-full p-4 border-2 rounded-2xl text-right focus:border-red-500 outline-none" required>
                  <option value="">کسٹمر منتخب کریں</option>
                  {udhars.map(u => <option key={u.udhar_id} value={u.customer_name}>{u.customer_name}</option>)}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2 text-right">رقم (روپے میں) *</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مثلاً: 500" className="w-full p-4 border-2 rounded-2xl text-right focus:border-red-500 outline-none" required />
              </div>
              <div className="flex gap-4">
                <button type="submit" disabled={formLoading} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all">{formLoading ? "کٹوتی کر رہا ہے..." : "✂️ کٹوتی کریں"}</button>
                <button type="button" onClick={() => { setShowDeductionForm(false); setSelectedCustomer(""); setAmount(""); }} className="flex-1 bg-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-300 transition-all">❌ منسوخ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-t-3xl shadow-sm border-b overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-black text-gray-800">📒 کھاتہ (اُدھار کا خلاصہ)</h2>
              <p className="text-gray-500">کل کسٹمرز: {filteredUdhars.length}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => handleSort("customer")} className={`px-4 py-2 rounded-2xl font-bold text-sm transition-all ${sortBy === "customer" ? "bg-amber-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>نام {sortBy === "customer" && (sortOrder === "asc" ? "↑" : "↓")}</button>
              <button onClick={() => handleSort("total")} className={`px-4 py-2 rounded-2xl font-bold text-sm transition-all ${sortBy === "total" ? "bg-amber-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>رقم {sortBy === "total" && (sortOrder === "asc" ? "↑" : "↓")}</button>
              <button onClick={() => handleSort("created_date")} className={`px-4 py-2 rounded-2xl font-bold text-sm transition-all ${sortBy === "created_date" ? "bg-amber-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>تخلیق تاریخ {sortBy === "created_date" && (sortOrder === "asc" ? "↑" : "↓")}</button>
              <button onClick={() => handleSort("paid_date")} className={`px-4 py-2 rounded-2xl font-bold text-sm transition-all ${sortBy === "paid_date" ? "bg-amber-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>ادائیگی تاریخ {sortBy === "paid_date" && (sortOrder === "asc" ? "↑" : "↓")}</button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <input type="text" placeholder="🔍 کسٹمر نام سے تلاش کریں..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-4 border-2 border-gray-200 rounded-3xl focus:border-amber-500 outline-none text-right" />
            </form>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => { setShowAdditionForm(true); setFormMessage({ text: "", type: "" }); }} className="px-6 py-3 rounded-3xl font-bold bg-green-600 text-white hover:bg-green-700 transition-all">💰 براہ راست جمع</button>
              <button onClick={() => { setShowDeductionForm(true); setFormMessage({ text: "", type: "" }); }} className="px-6 py-3 rounded-3xl font-bold bg-red-600 text-white hover:bg-red-700 transition-all">✂️ براہ راست کٹوتی</button>
              <button onClick={() => handleFilter("all")} className={`px-6 py-3 rounded-3xl font-bold transition-all ${statusFilter === "all" ? "bg-amber-600 text-white shadow-lg" : "bg-gray-100 hover:bg-gray-200"}`}>📋 سب</button>
              <button onClick={() => handleFilter("unpaid")} className={`px-6 py-3 rounded-3xl font-bold transition-all ${statusFilter === "unpaid" ? "bg-rose-600 text-white shadow-lg" : "bg-gray-100 hover:bg-gray-200"}`}>⚠️ غیر ادا شدہ</button>
              <button onClick={() => handleFilter("paid")} className={`px-6 py-3 rounded-3xl font-bold transition-all ${statusFilter === "paid" ? "bg-emerald-600 text-white shadow-lg" : "bg-gray-100 hover:bg-gray-200"}`}>✅ ادا شدہ</button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-xl rounded-b-3xl overflow-hidden border overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-5 border-l font-bold cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort("customer")}>👤 کسٹمر</th>
              <th className="p-5 border-l font-bold text-center whitespace-nowrap">🔢 اُدھار نمبر</th>
              <th className="p-5 border-l font-bold text-center whitespace-nowrap">💰 سب ٹوٹل</th>
              <th className="p-5 border-l font-bold text-center whitespace-nowrap">➕ براہ راست جمع</th>
              <th className="p-5 border-l font-bold text-center whitespace-nowrap">➖ براہ راست کٹوتی</th>
              <th className="p-5 border-l font-bold text-center cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort("total")}>📊 کل اُدھار</th>
              <th className="p-5 border-l font-bold text-center cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort("created_date")}>📅 تخلیق تاریخ / وقت</th>
              <th className="p-5 border-l font-bold text-center cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort("paid_date")}>✅ ادائیگی تاریخ / وقت</th>
              <th className="p-5 border-l font-bold text-center whitespace-nowrap">🏷️ اسٹیٹس</th>
              <th className="p-5 text-center font-bold whitespace-nowrap">⚙️ عمل</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="p-20 text-center text-gray-400"><div className="flex flex-col items-center gap-2"><div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div><span>لوڈ ہو رہا ہے...</span></div></td></tr>
            ) : currentItems.length > 0 ? (
              currentItems.map((u) => {
                const dateParts = extractDateParts(u.created_date_urdu);
                const paidDateParts = u.paid_date_urdu ? extractDateParts(u.paid_date_urdu) : { day: "", month: "", year: "" };
                const dayName = extractDayName(u.created_date_urdu);
                const paidDayName = u.paid_date_urdu ? extractDayName(u.paid_date_urdu) : "";
                
                return (
                  <tr key={u.udhar_id} className="border-b hover:bg-amber-50 transition-colors">
                    <td className="p-5 border-l font-bold whitespace-nowrap">{u.customer_name}</td>
                    <td className="p-5 border-l text-center font-mono whitespace-nowrap">#{u.udhar_id}</td>
                    <td className="p-5 border-l text-center whitespace-nowrap">{u.subtotal?.toLocaleString() || 0}</td>
                    <td className="p-5 border-l text-center text-green-600 font-bold whitespace-nowrap">+{u.direct_addition?.toLocaleString() || 0}</td>
                    <td className="p-5 border-l text-center text-red-600 font-bold whitespace-nowrap">-{u.direct_deduction?.toLocaleString() || 0}</td>
                    <td className="p-5 border-l text-center font-bold text-xl text-amber-700 whitespace-nowrap">{u.total?.toLocaleString() || 0}</td>
                    <td className="p-5 border-l text-center text-sm whitespace-nowrap">
                      <div>{dayName}، {dateParts.day} {dateParts.month} {dateParts.year}</div>
                      <div className="text-xs text-gray-500 mt-1">{u.udhar_time || u.created_time || "—"}</div>
                    </td>
                    <td className="p-5 border-l text-center text-sm whitespace-nowrap">
                      {u.status === "paid" ? (
                        <>
                          <div>{paidDayName}، {paidDateParts.day} {paidDateParts.month} {paidDateParts.year}</div>
                          <div className="text-xs text-gray-500 mt-1">{u.paid_time || "—"}</div>
                        </>
                      ) : "—"}
                    </td>
                    <td className="p-5 border-l text-center whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${u.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {u.status === "paid" ? "✅ ادا شدہ" : "⏳ غیر ادا شدہ"}
                      </span>
                    </td>
                    <td className="p-5 text-center whitespace-nowrap">
                      <div className="flex gap-2 justify-center items-center">
                        <button onClick={() => setSelectedUdhar(u)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-2xl font-medium text-sm transition-all">👁️ دیکھیں</button>
                        <button onClick={() => printUdhar(u)} className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-2xl font-medium text-sm transition-all">🖨️ پرنٹ</button>
                        <button onClick={() => setDeleteId(u.udhar_id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-2xl font-medium text-sm transition-all">🗑️ حذف</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="p-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-4xl">
                      📊
                    </div>
                    <p className="text-gray-500 text-lg font-medium">{getEmptyMessage()}</p>
                    {(search || statusFilter !== "all") && (
                      <button 
                        onClick={() => { 
                          setSearch(""); 
                          setStatusFilter("all"); 
                          applyFiltersAndSort();
                        }} 
                        className="text-amber-600 hover:text-amber-700 font-bold underline"
                      >
                        تمام کسٹمرز دیکھیں
                      </button>
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
        <div className="mt-4 flex justify-center items-center gap-2 bg-white p-4 rounded-xl shadow">
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="h-8 w-8 rounded-lg border font-bold disabled:opacity-50 bg-white hover:bg-gray-100 transition-all">→</button>
          {[...Array(totalPages)].map((_, i) => (<button key={i} onClick={() => setCurrentPage(i + 1)} className={`h-8 w-8 rounded-lg border font-bold transition-all ${currentPage === i + 1 ? "bg-amber-600 text-white border-amber-600" : "bg-white hover:bg-gray-100"}`}>{i + 1}</button>))}
          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="h-8 w-8 rounded-lg border font-bold disabled:opacity-50 bg-white hover:bg-gray-100 transition-all">←</button>
        </div>
      )}

      {/* Udhar Preview Modal */}
      {selectedUdhar && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto p-8">
            <div className="text-center mb-8"><h1 className="text-3xl font-black text-gray-800">{shopInfo.shop_name || "میرا اسٹور"}</h1><p className="text-gray-600">{shopInfo.address}</p><p className="text-sm text-gray-500">مالک: {shopInfo.owner_name || user?.username}</p></div>
            <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-2xl flex-wrap gap-3">
              <div><span className="text-gray-600">اُدھار نمبر:</span> <strong>#{selectedUdhar.udhar_id}</strong></div>
              <div><span className="text-gray-600">کسٹمر:</span> <strong>{selectedUdhar.customer_name}</strong></div>
              <div><span className="text-gray-600">تاریخ تخلیق:</span> <strong>{selectedUdhar.created_date_urdu}</strong></div>
              <div><span className="text-gray-600">وقت:</span> <strong>{selectedUdhar.udhar_time || selectedUdhar.created_time || "—"}</strong></div>
            </div>
            {selectedUdhar.status === "paid" && selectedUdhar.paid_date && (<div className="bg-emerald-50 p-4 rounded-2xl mb-6 text-center"><p className="text-emerald-700 font-bold">✅ ادا شدہ تاریخ: {selectedUdhar.paid_date_urdu} • {selectedUdhar.paid_time}</p></div>)}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-8 rounded-2xl text-center mb-8 text-white"><p className="text-sm opacity-90">کل واجب الادا</p><p className="text-5xl font-black mt-2">{selectedUdhar.total?.toLocaleString()} روپے</p></div>
            <div className="grid grid-cols-2 gap-6 text-lg mb-8 p-6 bg-gray-50 rounded-2xl">
              <div className="text-right"><p className="text-gray-600 text-sm">سب ٹوٹل</p><p className="font-bold text-xl">{selectedUdhar.subtotal?.toLocaleString()} روپے</p></div>
              <div className="text-right"><p className="text-gray-600 text-sm">براہ راست جمع</p><p className="font-bold text-xl text-green-600">+ {selectedUdhar.direct_addition?.toLocaleString()}</p></div>
              <div className="text-right"><p className="text-gray-600 text-sm">براہ راست کٹوتی</p><p className="font-bold text-xl text-red-600">- {selectedUdhar.direct_deduction?.toLocaleString()}</p></div>
              <div className="text-right"><p className="text-gray-600 text-sm">اسٹیٹس</p><p className={`font-bold text-base ${selectedUdhar.status === "paid" ? "text-emerald-600" : "text-rose-600"}`}>{selectedUdhar.status === "paid" ? "ادا شدہ" : "غیر ادا شدہ"}</p></div>
            </div>
            <div className="flex gap-4 flex-wrap">
              <button onClick={() => printUdhar(selectedUdhar)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-3xl font-bold transition-all">🖨️ پرنٹ بل</button>
              {selectedUdhar.status === "unpaid" ? (<button onClick={() => payUdhar(selectedUdhar.customer_name)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-3xl font-bold transition-all">💰 ابھی ادا کریں</button>) : (<button disabled className="flex-1 bg-gray-300 text-gray-500 py-4 rounded-3xl font-bold cursor-not-allowed">✅ ادا شدہ</button>)}
              <button onClick={() => setSelectedUdhar(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 py-4 rounded-3xl font-bold transition-all">❌ بند کریں</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[400] flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2">کیا آپ کو یقین ہے؟</h3>
            <p className="text-gray-500 text-sm mb-6">یہ اُدھار ہمیشہ کے لیے حذف ہو جائے گا۔ اس کے تمام متعلقہ آئٹمز بھی حذف ہو جائیں گے۔</p>
            {deleteError && <div className="mb-4 p-3 rounded-xl text-center bg-red-100 text-red-700 border border-red-400 text-sm">❌ {deleteError}</div>}
            <div className="flex gap-3">
              <button onClick={handleDeleteUdhar} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all">ہاں، حذف کریں</button>
              <button onClick={() => { setDeleteId(null); setDeleteError(""); }} className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">منسوخ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Udhaars;