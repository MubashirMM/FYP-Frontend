import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function Bills({ onItemAdded, onClose }) {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedBill, setSelectedBill] = useState(null);
  const [shopInfo, setShopInfo] = useState({ shop_name: "میرا اسٹور", owner_name: "", address: "" });
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, getAuthHeader());
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };

const fetchBills = async (status = null) => {
  setLoading(true);
  try {
    const params = status && status !== "all" ? { status } : {};
    const res = await axios.get(`${API}/bills/`, { params, ...getAuthHeader() });
    const data = res.data.map(b => ({
      ...b,
      customer_name: b.customer_name || "نقد"
    }));
    setBills(data);
    setFilteredBills(data);
    setCurrentPage(1);
  } catch (err) {
    // Silent fail for 404 (no bills found)
    if (err.response?.status !== 404) {
      showMsg(err.response?.data?.detail || "بلز لوڈ کرنے میں خرابی", "error");
    }
    // Set empty arrays when no bills found
    setBills([]);
    setFilteredBills([]);
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

const payBill = async (customerName) => {
  if (!customerName || customerName === "نقد") return showMsg("نقد بل ادا نہیں کیا جا سکتا", "error");
  try {
    await axios.put(`${API}/bills/pay/${customerName}/`, {}, getAuthHeader());
    showMsg("✅ بل کامیابی سے ادا کر دیا گیا", "success");
    // Wait for fetch to complete before closing modal
    await fetchBills();
    setSelectedBill(null);
  } catch (err) {
    showMsg(err.response?.data?.detail || "ادائیگی ناکام", "error");
  }
};

  const handleDeleteBill = async () => {
    setDeleteError("");
    try {
      await axios.delete(`${API}/bills/${deleteId}`, getAuthHeader());
      showMsg("✅ بل کامیابی سے حذف کر دیا گیا", "success");
      setDeleteId(null); 
      fetchBills();
      if (onItemAdded) onItemAdded();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "حذف کرنے میں خرابی";
      setDeleteError(errorMsg);
    }
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  }; 

  const printBill = (bill) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl"><head><title>بل</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;line-height:1.6}
        .header{text-align:center;margin-bottom:30px}
        table{width:100%;border-collapse:collapse;margin:20px 0}
        th,td{border:1px solid #ccc;padding:10px;text-align:right}
        .total{font-size:1.6em;font-weight:bold;text-align:right;margin-top:30px}
      </style>
      </head><body>
        <div class="header">
  <h1>${shopInfo.shop_name || "میرا اسٹور"}</h1>
  <p>${shopInfo.address || ""}</p>
  <p>مالک: ${shopInfo.owner_name || user?.username || ""}</p>
</div>
        <hr>
        <p><strong>کسٹمر:</strong> ${bill.customer_name}</p>
        <p><strong>بل نمبر:</strong> ${bill.bill_id}</p>
        <p><strong>تاریخ:</strong> ${bill.bill_day_name}، ${bill.bill_day} ${bill.bill_month} ${bill.bill_year} • ${bill.bill_time}</p>
        ${bill.status === "paid" ? `<p><strong>ادا شدہ تاریخ:</strong> ${bill.bill_day_name}، ${bill.bill_day} ${bill.bill_month} ${bill.bill_year}</p>` : ''}
        <table>
          <thead> <tr><th>آئٹم</th><th>مقدار</th><th>فی اکائی</th><th>کل</th></tr> </thead>
          <tbody>
            ${bill.items?.map(item => `
              <tr><td>${item.item_name}</td><td>${item.quantity} ${item.requested_unit}</td><td>${item.unit_price}</td><td>${item.total_amount}</td></tr>
            `).join('') || '<tr><td colspan="4">کوئی آئٹم نہیں</td></tr>'}
          </tbody>
        </table>
        <p><strong>سب ٹوٹل:</strong> ${bill.udhar_items_total}</p>
        <p><strong>براہ راست جمع:</strong> ${bill.direct_addition}</p>
        <p><strong>براہ راست کٹوتی:</strong> ${bill.direct_deduction}</p>
        <div class="total">کل رقم: ${bill.effective_total} روپے</div>
        <p style="text-align:center;margin-top:60px">شکریہ!</p>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  useEffect(() => {
    fetchBills();
    fetchShopInfo();
    fetchUser();
  }, []);

  const applyFiltersAndSort = () => {
    let filtered = [...bills];
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }
    
    if (search) {
      filtered = filtered.filter(b => 
        (b.customer_name || "").toLowerCase().includes(search.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === "customer") {
        aVal = a.customer_name;
        bVal = b.customer_name;
      } else if (sortBy === "total") {
        aVal = a.effective_total;
        bVal = b.effective_total;
      } else {
        aVal = `${a.bill_year}-${a.bill_month}-${a.bill_day}`;
        bVal = `${b.bill_year}-${b.bill_month}-${b.bill_day}`;
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredBills(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    applyFiltersAndSort();
  }, [bills, statusFilter, search, sortBy, sortOrder]);

  const handleFilter = (filter) => {
    setStatusFilter(filter);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applyFiltersAndSort();
  };

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(newOrder);
  };

  const getEmptyMessage = () => {
    if (search) return `"${search}" کے نام سے کوئی بل نہیں ملا`;
    if (statusFilter === "paid") return "کوئی ادا شدہ بل موجود نہیں ہے";
    if (statusFilter === "unpaid") return "کوئی غیر ادا شدہ بل موجود نہیں ہے";
    return "کوئی بل موجود نہیں ہے";
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBills.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);

  return (
    <div className="relative min-h-screen bg-gray-50 p-3 md:p-6" dir="rtl">
      {/* Centered Message Toast */}
      {message.text && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl animate-slide-down text-sm md:text-base transition-all duration-300"
          style={{
            backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <span className="text-lg">✅</span>
            ) : (
              <span className="text-lg">❌</span>
            )}
            <span className="font-urdu">{message.text}</span>
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-t-3xl shadow-sm border-b">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800">🧾 بلز کی فہرست</h2>
            <p className="text-gray-500">کل بلز: {filteredBills.length}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => handleSort("customer")} className={`px-4 py-2 rounded-2xl font-bold text-sm ${sortBy === "customer" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
              نام {sortBy === "customer" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button onClick={() => handleSort("total")} className={`px-4 py-2 rounded-2xl font-bold text-sm ${sortBy === "total" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
              رقم {sortBy === "total" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button onClick={() => handleSort("date")} className={`px-4 py-2 rounded-2xl font-bold text-sm ${sortBy === "date" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
              تاریخ {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <input type="text" placeholder="کسٹمر نام سے تلاش کریں..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-4 border-2 border-gray-200 rounded-3xl focus:border-blue-500 outline-none text-right" />
          </form>
          <div className="flex gap-2">
            <button onClick={() => handleFilter("all")} className={`px-6 py-3 rounded-3xl font-bold ${statusFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>سب</button>
            <button onClick={() => handleFilter("unpaid")} className={`px-6 py-3 rounded-3xl font-bold ${statusFilter === "unpaid" ? "bg-rose-600 text-white" : "bg-gray-100"}`}>غیر ادا شدہ</button>
            <button onClick={() => handleFilter("paid")} className={`px-6 py-3 rounded-3xl font-bold ${statusFilter === "paid" ? "bg-emerald-600 text-white" : "bg-gray-100"}`}>ادا شدہ</button>
            {/* <button onClick={onClose} className="px-6 py-3 rounded-3xl font-bold bg-gray-500 text-white hover:bg-gray-600 transition-all">
              ✕ بند کریں
            </button> */}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-b-3xl overflow-hidden border overflow-x-auto">
        <table className="w-full min-w-[1200px] text-right">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-5 border-l font-bold cursor-pointer hover:bg-gray-200" onClick={() => handleSort("customer")}>کسٹمر</th>
              <th className="p-5 border-l font-bold text-center">بل نمبر</th>
              <th className="p-5 border-l font-bold text-center">دن</th>
              <th className="p-5 border-l font-bold text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort("date")}>تاریخ</th>
              <th className="p-5 border-l font-bold text-center">وقت</th>
              <th className="p-5 border-l font-bold text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort("total")}>کل رقم</th>
              <th className="p-5 border-l font-bold text-center">اسٹیٹس</th>
              <th className="p-5 text-center font-bold">عمل</th>
            </tr>
          </thead>
          <tbody>
            {loading ? 
              <tr><td colSpan="8" className="p-20 text-center text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>لوڈ ہو رہا ہے...</span>
                </div>
              </td></tr>
              : currentItems.length > 0 ? 
                currentItems.map(bill => (
                  <tr key={bill.bill_id} className="border-b hover:bg-blue-50 transition-colors">
                    <td className="p-5 border-l font-bold">{bill.customer_name}</td>
                    <td className="p-5 border-l text-center font-mono">#{bill.bill_id}</td>
                    <td className="p-5 border-l text-center">{bill.bill_day_name}</td>
                    <td className="p-5 border-l text-center">{bill.bill_day} {bill.bill_month} {bill.bill_year}</td>
                    <td className="p-5 border-l text-center">{bill.bill_time}</td>
                    <td className="p-5 border-l text-center font-bold text-lg text-blue-700">{bill.effective_total}</td>
                    <td className="p-5 border-l text-center">
                      <span className={`px-5 py-1 rounded-full text-sm font-bold ${bill.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {bill.status === "paid" ? "ادا شدہ" : "غیر ادا شدہ"}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => setSelectedBill(bill)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-2xl font-medium text-sm transition-all">
                          👁️ دیکھیں
                        </button>
                        <button onClick={() => printBill(bill)} className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-2xl font-medium text-sm transition-all">
                          🖨️ پرنٹ
                        </button>
                        <button onClick={() => setDeleteId(bill.bill_id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-2xl font-medium text-sm transition-all">
                          🗑️ حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : (
                <tr>
                  <td colSpan="8" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-4xl">📋</div>
                      <p className="text-gray-500 text-lg font-medium">{getEmptyMessage()}</p>
                      {(search || statusFilter !== "all") && (
                        <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="text-blue-600 hover:text-blue-700 font-bold underline">
                          تمام بل دیکھیں
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-2 bg-white p-4 rounded-xl shadow">
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
                currentPage === i + 1 ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-100"
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

      {/* Bill Preview Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-gray-800">{shopInfo.shop_name || "میرا اسٹور"}</h1>
              <p className="text-gray-600">{shopInfo.address}</p>
              <p className="text-sm text-gray-500">مالک: {shopInfo.owner_name || user?.username}</p>
            </div>

            <div className="flex justify-between text-lg mb-6 p-4 bg-gray-50 rounded-2xl flex-wrap gap-3">
              <div><strong>کسٹمر:</strong> {selectedBill.customer_name}</div>
              <div><strong>بل نمبر:</strong> #{selectedBill.bill_id}</div>
              <div>{selectedBill.bill_day_name} • {selectedBill.bill_day} {selectedBill.bill_month} {selectedBill.bill_year} • {selectedBill.bill_time}</div>
            </div>

            {selectedBill.status === "paid" && (
              <div className="bg-emerald-50 p-4 rounded-2xl mb-6 text-center">
                <p className="text-emerald-700 font-bold">✅ ادا شدہ تاریخ: {selectedBill.bill_day_name}، {selectedBill.bill_day} {selectedBill.bill_month} {selectedBill.bill_year}</p>
              </div>
            )}

            <div className="border rounded-2xl overflow-hidden mb-8">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-right">آئٹم</th>
                    <th className="p-4 text-center">مقدار</th>
                    <th className="p-4 text-center">فی اکائی</th>
                    <th className="p-4 text-right">کل</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items?.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-4">{item.item_name}</td>
                      <td className="p-4 text-center">{item.quantity} {item.requested_unit}</td>
                      <td className="p-4 text-center">{item.unit_price}</td>
                      <td className="p-4 text-right font-bold">{item.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-6 text-lg mb-10 p-6 bg-gray-50 rounded-2xl">
              <div>سب ٹوٹل: <strong>{selectedBill.udhar_items_total}</strong></div>
              <div>براہ راست جمع: <strong className="text-green-600">{selectedBill.direct_addition}</strong></div>
              <div>براہ راست کٹوتی: <strong className="text-red-600">{selectedBill.direct_deduction}</strong></div>
              <div className="text-2xl font-black text-right">کل رقم: {selectedBill.effective_total} روپے</div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => printBill(selectedBill)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-3xl font-bold text-lg transition-all">
                🖨️ پرنٹ بل
              </button>
              {selectedBill.status === "unpaid" && selectedBill.customer_name !== "نقد" ? (
                <button onClick={() => payBill(selectedBill.customer_name)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-3xl font-bold text-lg transition-all">
                  💰 ابھی ادا کریں
                </button>
              ) : (
                <button disabled className="flex-1 bg-gray-300 text-gray-500 py-4 rounded-3xl font-bold text-lg cursor-not-allowed">✅ ادا شدہ</button>
              )}
              <button onClick={() => setSelectedBill(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 py-4 rounded-3xl font-bold text-lg transition-all">❌ بند کریں</button>
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
            <p className="text-gray-500 text-sm mb-6">یہ بل ہمیشہ کے لیے حذف ہو جائے گا۔</p>
            
            {deleteError && (
              <div className="mb-4 p-3 rounded-xl text-center bg-red-100 text-red-700 border border-red-400 text-sm">
                ❌ {deleteError}
              </div>
            )}
            
            <div className="flex gap-3">
              <button onClick={handleDeleteBill} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 text-sm transition-all">
                ہاں، حذف کریں
              </button>
              <button onClick={() => {
                setDeleteId(null);
                setDeleteError("");
              }} className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 text-sm transition-all">
                منسوخ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bills;