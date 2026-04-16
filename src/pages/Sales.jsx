import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function Sales({ onClose }) {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [shopInfo, setShopInfo] = useState({ shop_name: "میرا اسٹور", owner_name: "", address: "" });
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [summary, setSummary] = useState({ total_sales: 0, total_quantity: 0 });
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // Pagination
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

  const fetchSales = async () => {
    setLoading(true);
    try {
      let url = `${API}/sales/?skip=0&limit=1000`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (startDate) {
        url += `&start_date=${startDate}`;
      }
      if (endDate) {
        url += `&end_date=${endDate}`;
      }
      
      const res = await axios.get(url, getAuthHeader());
      const data = res.data || [];
      setSales(data);
      applyFiltersAndSort(data, search, sortBy, sortOrder);
      
      // Fetch summary
      await fetchSummary();
    } catch (err) {
      showMsg(err.response?.data?.detail || "فروخت لوڈ کرنے میں خرابی", "error");
    } finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      let url = `${API}/sales/summary`;
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await axios.get(url, getAuthHeader());
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch summary", err);
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

  const handleDeleteSale = async () => {
    setDeleteError("");
    try {
      await axios.delete(`${API}/sales/${deleteId}`, getAuthHeader());
      showMsg("✅ فروخت کامیابی سے حذف کر دی گئی", "success");
      setDeleteId(null);
      fetchSales();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "حذف کرنے میں خرابی";
      setDeleteError(errorMsg);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchShopInfo();
    fetchUser();
  }, []);

  useEffect(() => {
    if (startDate || endDate || search) {
      const timer = setTimeout(() => {
        fetchSales();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate, search]);

  const applyFiltersAndSort = (data, searchTerm, sortField, order) => {
    let filtered = [...data];
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortField === "customer") {
        aVal = a.customer_name || "";
        bVal = b.customer_name || "";
      } else if (sortField === "item") {
        aVal = a.item_name || "";
        bVal = b.item_name || "";
      } else if (sortField === "quantity") {
        aVal = a.quantity_sold || 0;
        bVal = b.quantity_sold || 0;
      } else if (sortField === "date") {
        aVal = `${a.sale_year || "0000"}-${a.sale_month || "00"}-${a.sale_day || "00"}`;
        bVal = `${b.sale_year || "0000"}-${b.sale_month || "00"}-${b.sale_day || "00"}`;
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
    
    setFilteredSales(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSales();
  };

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(newOrder);
    applyFiltersAndSort(sales, search, field, newOrder);
  };

  const handleDateFilter = () => {
    fetchSales();
  };

  const clearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
    setTimeout(() => fetchSales(), 100);
  };

  const getEmptyMessage = () => {
    if (search) return `"${search}" کے مطابق کوئی فروخت نہیں ملی`;
    if (startDate || endDate) return "اس تاریخ کی حد میں کوئی فروخت نہیں ہے";
    return "کوئی فروخت موجود نہیں ہے";
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[400] flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              ⚠️
            </div>
            <h3 className="text-xl font-bold mb-2">کیا آپ کو یقین ہے؟</h3>
            <p className="text-gray-500 text-sm mb-6">یہ فروخت ہمیشہ کے لیے حذف ہو جائے گی۔</p>
            
            {deleteError && (
              <div className="mb-4 p-3 rounded-xl text-center bg-red-100 text-red-700 border border-red-400 text-sm">
                ❌ {deleteError}
              </div>
            )}
            
            <div className="flex gap-3">
              <button 
                onClick={handleDeleteSale} 
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 text-sm transition-all"
              >
                ہاں، حذف کریں
              </button>
              <button 
                onClick={() => {
                  setDeleteId(null);
                  setDeleteError("");
                }} 
                className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 text-sm transition-all"
              >
                منسوخ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-t-3xl shadow-sm border-b">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800">💰 فروخت کی فہرست</h2>
            <p className="text-gray-500">کل فروخت: {filteredSales.length} | کل مقدار: {summary.total_quantity || 0}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => handleSort("customer")} className={`px-4 py-2 rounded-2xl font-bold text-sm ${sortBy === "customer" ? "bg-emerald-600 text-white" : "bg-gray-100"}`}>
              نام {sortBy === "customer" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button onClick={() => handleSort("item")} className={`px-4 py-2 rounded-2xl font-bold text-sm ${sortBy === "item" ? "bg-emerald-600 text-white" : "bg-gray-100"}`}>
              آئٹم {sortBy === "item" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button onClick={() => handleSort("quantity")} className={`px-4 py-2 rounded-2xl font-bold text-sm ${sortBy === "quantity" ? "bg-emerald-600 text-white" : "bg-gray-100"}`}>
              مقدار {sortBy === "quantity" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button onClick={() => handleSort("date")} className={`px-4 py-2 rounded-2xl font-bold text-sm ${sortBy === "date" ? "bg-emerald-600 text-white" : "bg-gray-100"}`}>
              تاریخ {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <input 
              type="text" 
              placeholder="کسٹمر یا آئٹم نام سے تلاش کریں..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full p-4 border-2 border-gray-200 rounded-3xl focus:border-emerald-500 outline-none text-right"
            />
          </form>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDateFilter(!showDateFilter)} 
              className="px-6 py-3 rounded-3xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
            >
              📅 تاریخ فلٹر
            </button>
            {(search || startDate || endDate) && (
              <button 
                onClick={clearFilters} 
                className="px-6 py-3 rounded-3xl font-bold bg-gray-500 text-white hover:bg-gray-600 transition-all"
              >
                صاف کریں
              </button>
            )}
            {/* <button 
              onClick={onClose} 
              className="px-6 py-3 rounded-3xl font-bold bg-gray-500 text-white hover:bg-gray-600 transition-all"
            >
              ✕ بند کریں
            </button> */}
          </div>
        </div>

        {showDateFilter && (
          <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex gap-4 flex-wrap">
            <div className="flex-1">
              <label className="block text-sm font-bold mb-2 text-right">شروع تاریخ</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="w-full p-3 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold mb-2 text-right">آخری تاریخ</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="w-full p-3 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleDateFilter} 
                className="px-6 py-3 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                فلٹر لگائیں
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white shadow-xl rounded-b-3xl overflow-hidden border overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-5 border-l font-bold cursor-pointer hover:bg-gray-200" onClick={() => handleSort("customer")}>
                کسٹمر {sortBy === "customer" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-5 border-l font-bold text-center">فروخت نمبر</th>
              <th className="p-5 border-l font-bold text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort("item")}>
                آئٹم {sortBy === "item" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-5 border-l font-bold text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort("quantity")}>
                مقدار {sortBy === "quantity" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-5 border-l font-bold text-center">دن</th>
              <th className="p-5 border-l font-bold text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort("date")}>
                تاریخ {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-5 border-l font-bold text-center">وقت</th>
              <th className="p-5 text-center font-bold">عمل</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="p-20 text-center text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>لوڈ ہو رہا ہے...</span>
                </div>
              </td></tr>
            ) : currentItems.length > 0 ? (
              currentItems.map((sale) => (
                <tr key={sale.sale_id} className="border-b hover:bg-emerald-50 transition-colors">
                  <td className="p-5 border-l font-bold">{sale.customer_name || "نقد"}</td>
                  <td className="p-5 border-l text-center font-mono">#{sale.sale_id}</td>
                  <td className="p-5 border-l text-center font-bold text-emerald-700">{sale.item_name}</td>
                  <td className="p-5 border-l text-center font-bold text-lg">{sale.quantity_sold} {sale.item_unit || ""}</td>
                  <td className="p-5 border-l text-center">{sale.sale_day_name}</td>
                  <td className="p-5 border-l text-center">{sale.sale_day} {sale.sale_month} {sale.sale_year}</td>
                  <td className="p-5 border-l text-center text-sm">{sale.sale_time}</td>
                  <td className="p-5 text-center">
                    <button 
                      onClick={() => setDeleteId(sale.sale_id)} 
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-2xl font-medium text-sm transition-all"
                    >
                      🗑️ حذف کریں
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-4xl">💰</div>
                    <p className="text-gray-500 text-lg font-medium">{getEmptyMessage()}</p>
                    {(search || startDate || endDate) && (
                      <button onClick={clearFilters} className="text-emerald-600 hover:text-emerald-700 font-bold underline">
                        تمام فروخت دیکھیں
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
                currentPage === i + 1 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-gray-100"
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
    </div>
  );
}

export default Sales;