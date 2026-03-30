import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function Udhaars() {
  const [udhars, setUdhars] = useState([]);
  const [filteredUdhars, setFilteredUdhars] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedUdhar, setSelectedUdhar] = useState(null);
  const [shopInfo, setShopInfo] = useState({ shop_name: "میرا اسٹور", owner_name: "", address: "" });
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState("paid_date");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Form states for direct addition/deduction
  const [showAdditionForm, setShowAdditionForm] = useState(false);
  const [showDeductionForm, setShowDeductionForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [formLoading, setFormLoading] = useState(false);

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
      const res = await axios.get(`${API}/udhars`, getAuthHeader());
      const data = res.data || [];
      setUdhars(data);
      applyFiltersAndSort(data, statusFilter, search, sortBy, sortOrder);
    } catch (err) {
      showMsg(err.response?.data?.detail || "کھاتہ لوڈ کرنے میں خرابی", "error");
    } finally { setLoading(false); }
  };

  const fetchShopInfo = async () => {
    try {
      const res = await axios.get(`${API}/shops`, getAuthHeader());
      if (res.data?.length > 0) setShopInfo(res.data[0]);
    } catch {}
  };

  const payUdhar = async (customerName) => {
    try {
      const response = await axios.post(`${API}/udhars/pay`, null, { 
        params: { customer_name: customerName }, 
        ...getAuthHeader() 
      });
      showMsg(response.data.message || "اُدھار کامیابی سے ادا کر دیا گیا", "success");
      fetchUdhars();
      setSelectedUdhar(null);
    } catch (err) {
      showMsg(err.response?.data?.detail || "ادائیگی ناکام", "error");
    }
  };

  const handleDirectAddition = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !amount || amount <= 0) {
      showMsg("براہ کرم صحیح رقم اور کسٹمر نام درج کریں", "error");
      return;
    }
    
    setFormLoading(true);
    try {
      const response = await axios.put(
        `${API}/udhars/${selectedCustomer}/direct-addition`,
        null,
        { params: { amount: parseFloat(amount) }, ...getAuthHeader() }
      );
      showMsg(response.data.message || "براہ راست جمع کامیابی سے شامل کر دی گئی", "success");
      setShowAdditionForm(false);
      setSelectedCustomer("");
      setAmount("");
      fetchUdhars();
    } catch (err) {
      showMsg(err.response?.data?.detail || "جمع کرنے میں خرابی", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDirectDeduction = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !amount || amount <= 0) {
      showMsg("براہ کرم صحیح رقم اور کسٹمر نام درج کریں", "error");
      return;
    }
    
    setFormLoading(true);
    try {
      const response = await axios.put(
        `${API}/udhars/${selectedCustomer}/direct-deduction`,
        null,
        { params: { amount: parseFloat(amount) }, ...getAuthHeader() }
      );
      showMsg(response.data.message || "براہ راست کٹوتی کامیابی سے شامل کر دی گئی", "success");
      setShowDeductionForm(false);
      setSelectedCustomer("");
      setAmount("");
      fetchUdhars();
    } catch (err) {
      showMsg(err.response?.data?.detail || "کٹوتی کرنے میں خرابی", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const downloadUdhar = (udhar) => {
    // Create PDF-like HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>اُدھار بل - ${udhar.customer_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            padding: 50px;
            line-height: 1.8;
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
            color: #d97706;
            margin-bottom: 10px;
          }
          .shop-address {
            color: #666;
            font-size: 14px;
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
          .amount-box {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .amount-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
          }
          .amount-value {
            font-size: 48px;
            font-weight: bold;
          }
          .details-table {
            width: 100%;
            margin: 30px 0;
            border-collapse: collapse;
          }
          .details-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
          }
          .details-table td:first-child {
            font-weight: bold;
            color: #666;
          }
          .details-table td:last-child {
            text-align: left;
            font-weight: bold;
          }
          .status {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
          }
          .status-paid {
            background: #d1fae5;
            color: #065f46;
          }
          .status-unpaid {
            background: #fee2e2;
            color: #991b1b;
          }
          .footer {
            text-align: center;
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${shopInfo.shop_name || "میرا اسٹور"}</div>
          <div class="shop-address">${shopInfo.address || ""}</div>
          <div class="shop-address">مالک: ${shopInfo.owner_name || user?.username || ""}</div>
        </div>

        <div class="bill-info">
          <div class="info-group">
            <div class="info-label">اُدھار نمبر</div>
            <div class="info-value">#${udhar.udhar_id}</div>
          </div>
          <div class="info-group">
            <div class="info-label">کسٹمر</div>
            <div class="info-value">${udhar.customer_name}</div>
          </div>
          <div class="info-group">
            <div class="info-label">تاریخ تخلیق</div>
            <div class="info-value">${udhar.created_date_urdu || udhar.created_date}</div>
          </div>
        </div>

        ${udhar.status === "paid" && udhar.paid_date ? `
        <div class="bill-info" style="background: #d1fae5;">
          <div class="info-group">
            <div class="info-label">ادا شدہ تاریخ</div>
            <div class="info-value">${udhar.paid_date_urdu || udhar.paid_date}</div>
          </div>
        </div>
        ` : ''}

        <div class="amount-box">
          <div class="amount-label">کل واجب الادا رقم</div>
          <div class="amount-value">${udhar.total?.toLocaleString()} روپے</div>
        </div>

        <table class="details-table">
          <tr><td>سب ٹوٹل:</td><td>${udhar.subtotal?.toLocaleString()} روپے</td></tr>
          <tr><td>براہ راست جمع:</td><td style="color: #10b981">+ ${udhar.direct_addition?.toLocaleString()} روپے</td></tr>
          <tr><td>براہ راست کٹوتی:</td><td style="color: #ef4444">- ${udhar.direct_deduction?.toLocaleString()} روپے</td></tr>
          <tr><td>اسٹیٹس:</td><td><span class="status ${udhar.status === 'paid' ? 'status-paid' : 'status-unpaid'}">${udhar.status === "paid" ? "ادا شدہ" : "غیر ادا شدہ"}</span></td></tr>
        </table>

        <div class="footer">
          شکریہ! آپ کا اعتبار ہماری ترجیح ہے۔
        </div>
      </body>
      </html>
    `;

    // Create blob and trigger download
    const blob = new Blob([htmlContent], { type: 'application/pdf' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Udhaar_Bill_${udhar.customer_name}_${udhar.udhar_id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printUdhar = (udhar) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl"><head><title>اُدھار بل</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;line-height:1.6}
        .header{text-align:center;margin-bottom:30px}
        .amount{font-size:2em;font-weight:bold;color:#d97706;text-align:center;margin:30px}
      </style>
      </head><body>
        <div class="header">
          <h1>${shopInfo.shop_name || "میرا اسٹور"}</h1>
          <p>${shopInfo.address || ""}</p>
          <p>مالک: ${shopInfo.owner_name || user?.username}</p>
        </div>
        <hr>
        <p><strong>کسٹمر:</strong> ${udhar.customer_name}</p>
        <p><strong>اُدھار نمبر:</strong> #${udhar.udhar_id}</p>
        <p><strong>تاریخ تخلیق:</strong> ${udhar.created_date_urdu || udhar.created_date}</p>
        ${udhar.status === "paid" && udhar.paid_date ? `<p><strong>ادا شدہ تاریخ:</strong> ${udhar.paid_date_urdu || udhar.paid_date}</p>` : ''}
        <div class="amount">کل رقم: ${udhar.total} روپے</div>
        <p><strong>سب ٹوٹل:</strong> ${udhar.subtotal}</p>
        <p><strong>براہ راست جمع:</strong> ${udhar.direct_addition}</p>
        <p><strong>براہ راست کٹوتی:</strong> ${udhar.direct_deduction}</p>
        <p style="text-align:center;margin-top:50px">شکریہ!</p>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  useEffect(() => {
    fetchUdhars();
    fetchShopInfo();
    fetchUser();
  }, []);

  const applyFiltersAndSort = (data, filter, searchTerm, sortField, order) => {
    let filtered = [...data];
    
    if (filter !== "all") {
      filtered = filtered.filter(u => u.status === filter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortField === "customer") {
        aVal = a.customer_name;
        bVal = b.customer_name;
      } else if (sortField === "total") {
        aVal = a.total;
        bVal = b.total;
      } else if (sortField === "created_date") {
        aVal = a.created_date || "";
        bVal = b.created_date || "";
      } else if (sortField === "paid_date") {
        const aPaid = a.status === "paid" ? (a.paid_date || a.created_date) : "9999-12-31";
        const bPaid = b.status === "paid" ? (b.paid_date || b.created_date) : "9999-12-31";
        aVal = aPaid;
        bVal = bPaid;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }
      
      if (order === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredUdhars(filtered);
  };

  const handleFilter = (filter) => {
    setStatusFilter(filter);
    applyFiltersAndSort(udhars, filter, search, sortBy, sortOrder);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    applyFiltersAndSort(udhars, statusFilter, search, sortBy, sortOrder);
  };

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(newOrder);
    applyFiltersAndSort(udhars, statusFilter, search, field, newOrder);
  };

  const getEmptyMessage = () => {
    if (search) return `"${search}" کے نام سے کوئی کسٹمر نہیں ملا`;
    if (statusFilter === "paid") return "کوئی ادا شدہ اُدھار موجود نہیں ہے";
    if (statusFilter === "unpaid") return "کوئی غیر ادا شدہ اُدھار موجود نہیں ہے";
    return "کوئی اُدھار موجود نہیں ہے";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6" dir="rtl">
      {message.text && <div className={`fixed top-6 left-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>{message.text}</div>}

      {/* Direct Addition Form Modal */}
      {showAdditionForm && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <h3 className="text-2xl font-black mb-6 text-center">براہ راست جمع کریں</h3>
            <form onSubmit={handleDirectAddition}>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">کسٹمر کا نام</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 outline-none"
                  required
                >
                  <option value="">کسٹمر منتخب کریں</option>
                  {udhars.map(u => (
                    <option key={u.udhar_id} value={u.customer_name}>{u.customer_name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">رقم (روپے میں)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="مثلاً: 500"
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 outline-none"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold transition-all"
                >
                  {formLoading ? "جمع کر رہا ہے..." : "✅ جمع کریں"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdditionForm(false);
                    setSelectedCustomer("");
                    setAmount("");
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-4 rounded-2xl font-bold transition-all"
                >
                  ❌ منسوخ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Deduction Form Modal */}
      {showDeductionForm && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <h3 className="text-2xl font-black mb-6 text-center">براہ راست کٹوتی کریں</h3>
            <form onSubmit={handleDirectDeduction}>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">کسٹمر کا نام</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-red-500 outline-none"
                  required
                >
                  <option value="">کسٹمر منتخب کریں</option>
                  {udhars.map(u => (
                    <option key={u.udhar_id} value={u.customer_name}>{u.customer_name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">رقم (روپے میں)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="مثلاً: 500"
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-red-500 outline-none"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold transition-all"
                >
                  {formLoading ? "کٹوتی کر رہا ہے..." : "✂️ کٹوتی کریں"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeductionForm(false);
                    setSelectedCustomer("");
                    setAmount("");
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-4 rounded-2xl font-bold transition-all"
                >
                  ❌ منسوخ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-t-3xl shadow-sm border-b">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800">کھاتہ (اُدھار کا خلاصہ)</h2>
            <p className="text-gray-500">کل کسٹمرز: {udhars.length}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => handleSort("customer")} className={`px-4 py-2 rounded-2xl font-bold text-sm ${sortBy === "customer" ? "bg-amber-600 text-white" : "bg-gray-100"}`}>
              نام {sortBy === "customer" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button onClick={() => handleSort("total")} className={`px-4 py-2 rounded-2xl font-bold text-sm ${sortBy === "total" ? "bg-amber-600 text-white" : "bg-gray-100"}`}>
              رقم {sortBy === "total" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button onClick={() => handleSort("created_date")} className={`px-4 py-2 rounded-2xl font-bold text-sm ${sortBy === "created_date" ? "bg-amber-600 text-white" : "bg-gray-100"}`}>
              تخلیق تاریخ {sortBy === "created_date" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button onClick={() => handleSort("paid_date")} className={`px-4 py-2 rounded-2xl font-bold text-sm ${sortBy === "paid_date" ? "bg-amber-600 text-white" : "bg-gray-100"}`}>
              ادائیگی تاریخ {sortBy === "paid_date" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <input 
              type="text" 
              placeholder="کسٹمر نام سے تلاش کریں..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full p-4 border-2 border-gray-200 rounded-3xl focus:border-amber-500 outline-none"
            />
          </form>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAdditionForm(true)} 
              className="px-6 py-3 rounded-3xl font-bold bg-green-600 text-white hover:bg-green-700 transition-all"
            >
              + براہ راست جمع
            </button>
            <button 
              onClick={() => setShowDeductionForm(true)} 
              className="px-6 py-3 rounded-3xl font-bold bg-red-600 text-white hover:bg-red-700 transition-all"
            >
              - براہ راست کٹوتی
            </button>
            <button onClick={() => handleFilter("all")} className={`px-6 py-3 rounded-3xl font-bold transition-all ${statusFilter === "all" ? "bg-amber-600 text-white shadow-lg" : "bg-gray-100 hover:bg-gray-200"}`}>سب</button>
            <button onClick={() => handleFilter("unpaid")} className={`px-6 py-3 rounded-3xl font-bold transition-all ${statusFilter === "unpaid" ? "bg-rose-600 text-white shadow-lg" : "bg-gray-100 hover:bg-gray-200"}`}>غیر ادا شدہ</button>
            <button onClick={() => handleFilter("paid")} className={`px-6 py-3 rounded-3xl font-bold transition-all ${statusFilter === "paid" ? "bg-emerald-600 text-white shadow-lg" : "bg-gray-100 hover:bg-gray-200"}`}>ادا شدہ</button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-b-3xl overflow-hidden border overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-5 border-l font-bold cursor-pointer hover:bg-gray-200" onClick={() => handleSort("customer")}>
                کسٹمر {sortBy === "customer" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-5 border-l font-bold text-center">اُدھار نمبر</th>
              <th className="p-5 border-l font-bold text-center">سب ٹوٹل</th>
              <th className="p-5 border-l font-bold text-center">براہ راست جمع</th>
              <th className="p-5 border-l font-bold text-center">براہ راست کٹوتی</th>
              <th className="p-5 border-l font-bold text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort("total")}>
                کل اُدھار {sortBy === "total" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-5 border-l font-bold text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort("created_date")}>
                تخلیق تاریخ {sortBy === "created_date" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-5 border-l font-bold text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort("paid_date")}>
                ادائیگی تاریخ {sortBy === "paid_date" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-5 border-l font-bold text-center">اسٹیٹس</th>
              <th className="p-5 text-center font-bold">عمل</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="p-20 text-center text-gray-400">لوڈ ہو رہا ہے...</td></tr>
            ) : filteredUdhars.length > 0 ? (
              filteredUdhars.map((u) => (
                <tr key={u.udhar_id} className="border-b hover:bg-amber-50 transition-colors">
                  <td className="p-5 border-l font-bold">{u.customer_name}</td>
                  <td className="p-5 border-l text-center font-mono">#{u.udhar_id}</td>
                  <td className="p-5 border-l text-center">{u.subtotal?.toLocaleString() || 0}</td>
                  <td className="p-5 border-l text-center text-green-600">+{u.direct_addition?.toLocaleString() || 0}</td>
                  <td className="p-5 border-l text-center text-red-600">-{u.direct_deduction?.toLocaleString() || 0}</td>
                  <td className="p-5 border-l text-center font-bold text-xl text-amber-700">{u.total?.toLocaleString() || 0}</td>
                  <td className="p-5 border-l text-center text-sm">{u.created_date_urdu || u.created_date || "—"}</td>
                  <td className="p-5 border-l text-center text-sm">
                    {u.status === "paid" ? (u.paid_date_urdu || u.paid_date || "—") : "—"}
                  </td>
                  <td className="p-5 border-l text-center">
                    <span className={`px-5 py-1 rounded-full text-sm font-bold ${u.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {u.status === "paid" ? "ادا شدہ" : "غیر ادا شدہ"}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => setSelectedUdhar(u)} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl font-medium text-sm transition-all hover:scale-105"
                      >
                        👁️ دیکھیں
                      </button>
                      <button 
                        onClick={() => downloadUdhar(u)} 
                        className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-2xl font-medium text-sm transition-all hover:scale-105"
                      >
                        📥 ڈاؤن لوڈ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="p-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-4xl">📊</div>
                    <p className="text-gray-500 text-lg font-medium">{getEmptyMessage()}</p>
                    {(search || statusFilter !== "all") && (
                      <button 
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("all");
                          applyFiltersAndSort(udhars, "all", "", sortBy, sortOrder);
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

      {/* Udhar Preview Modal */}
      {selectedUdhar && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-gray-800">{shopInfo.shop_name || "میرا اسٹور"}</h1>
              <p className="text-gray-600">{shopInfo.address}</p>
              <p className="text-sm text-gray-500">مالک: {shopInfo.owner_name || user?.username}</p>
            </div>

            <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-2xl flex-wrap gap-3">
              <div><span className="text-gray-600">اُدھار نمبر:</span> <strong className="text-lg">#{selectedUdhar.udhar_id}</strong></div>
              <div><span className="text-gray-600">کسٹمر:</span> <strong className="text-lg">{selectedUdhar.customer_name}</strong></div>
              <div><span className="text-gray-600">تاریخ تخلیق:</span> <strong>{selectedUdhar.created_date_urdu || selectedUdhar.created_date}</strong></div>
            </div>

            {selectedUdhar.status === "paid" && selectedUdhar.paid_date && (
              <div className="bg-emerald-50 p-4 rounded-2xl mb-6 text-center">
                <p className="text-emerald-700 font-bold">✅ ادا شدہ تاریخ: {selectedUdhar.paid_date_urdu || selectedUdhar.paid_date}</p>
              </div>
            )}

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-8 rounded-2xl text-center mb-8 text-white">
              <p className="text-sm opacity-90">کل واجب الادا</p>
              <p className="text-5xl font-black mt-2">{selectedUdhar.total?.toLocaleString()} روپے</p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-lg mb-8 p-6 bg-gray-50 rounded-2xl">
              <div className="text-right">
                <p className="text-gray-600 text-sm">سب ٹوٹل</p>
                <p className="font-bold text-xl">{selectedUdhar.subtotal?.toLocaleString()} روپے</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-sm">براہ راست جمع</p>
                <p className="font-bold text-xl text-green-600">+ {selectedUdhar.direct_addition?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-sm">براہ راست کٹوتی</p>
                <p className="font-bold text-xl text-red-600">- {selectedUdhar.direct_deduction?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-sm">اسٹیٹس</p>
                <p className={`font-bold text-xl ${selectedUdhar.status === "paid" ? "text-emerald-600" : "text-rose-600"}`}>
                  {selectedUdhar.status === "paid" ? "ادا شدہ" : "غیر ادا شدہ"}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => downloadUdhar(selectedUdhar)} className="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-5 rounded-3xl font-bold text-lg transition-all hover:scale-105">
                📥 ڈاؤن لوڈ بل
              </button>
              <button onClick={() => printUdhar(selectedUdhar)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-3xl font-bold text-lg transition-all hover:scale-105">
                🖨️ پرنٹ بل
              </button>
              {selectedUdhar.status === "unpaid" ? (
                <button onClick={() => payUdhar(selectedUdhar.customer_name)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-3xl font-bold text-lg transition-all hover:scale-105">
                  💰 ابھی ادا کریں
                </button>
              ) : (
                <button disabled className="flex-1 bg-gray-300 text-gray-500 py-5 rounded-3xl font-bold text-lg cursor-not-allowed">
                  ✅ ادا شدہ
                </button>
              )}
              <button onClick={() => setSelectedUdhar(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 py-5 rounded-3xl font-bold text-lg transition-all">
                ❌ بند کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Udhaars;