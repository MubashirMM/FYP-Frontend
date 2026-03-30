import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function Sales() {
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
      let url = `${API}/sales?skip=0&limit=1000`;
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
      if (startDate) {
        url += `?start_date=${startDate}`;
      }
      if (endDate) {
        url += `${startDate ? '&' : '?'}end_date=${endDate}`;
      }
      const res = await axios.get(url, getAuthHeader());
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch summary", err);
    }
  };

  const fetchShopInfo = async () => {
    try {
      const res = await axios.get(`${API}/shops`, getAuthHeader());
      if (res.data?.length > 0) setShopInfo(res.data[0]);
    } catch {}
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/sales/${deleteId}`, getAuthHeader());
      showMsg("فروخت کامیابی سے حذف کر دی گئی", "success");
      setDeleteId(null);
      fetchSales();
    } catch (err) {
      showMsg(err.response?.data?.detail || "حذف کرنے میں خرابی", "error");
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
        s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortField === "customer") {
        aVal = a.customer_name;
        bVal = b.customer_name;
      } else if (sortField === "item") {
        aVal = a.item_name;
        bVal = b.item_name;
      } else if (sortField === "quantity") {
        aVal = a.quantity_sold;
        bVal = b.quantity_sold;
      } else if (sortField === "date") {
        aVal = `${a.sale_year}-${a.sale_month}-${a.sale_day}`;
        bVal = `${b.sale_year}-${b.sale_month}-${b.sale_day}`;
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

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6" dir="rtl">
      {message.text && (
        <div className={`fixed top-6 left-6 z-[300] px-6 py-3 rounded-2xl shadow-2xl ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {message.text}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
              ⚠️
            </div>
            <h3 className="text-2xl font-black mb-2">کیا آپ کو یقین ہے؟</h3>
            <p className="text-gray-500 mb-8">یہ فروخت ہمیشہ کے لیے حذف ہو جائے گی۔</p>
            <div className="flex gap-4">
              <button 
                onClick={confirmDelete} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-3xl font-bold transition-all"
              >
                ہاں، حذف کریں
              </button>
              <button 
                onClick={() => setDeleteId(null)} 
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-4 rounded-3xl font-bold transition-all"
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
            <h2 className="text-2xl font-black text-gray-800">فروخت کی فہرست</h2>
            <p className="text-gray-500">کل فروخت: {sales.length} | کل مقدار: {summary.total_quantity}</p>
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
              className="w-full p-4 border-2 border-gray-200 rounded-3xl focus:border-emerald-500 outline-none"
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
          </div>
        </div>

        {showDateFilter && (
          <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex gap-4 flex-wrap">
            <div className="flex-1">
              <label className="block text-sm font-bold mb-2">شروع تاریخ</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="w-full p-3 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold mb-2">آخری تاریخ</label>
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
              <tr><td colSpan="8" className="p-20 text-center text-gray-400">لوڈ ہو رہا ہے...</td></tr>
            ) : filteredSales.length > 0 ? (
              filteredSales.map((sale) => (
                <tr key={sale.sale_id} className="border-b hover:bg-emerald-50 transition-colors">
                  <td className="p-5 border-l font-bold">{sale.customer_name}</td>
                  <td className="p-5 border-l text-center font-mono">#{sale.sale_id}</td>
                  <td className="p-5 border-l text-center font-bold text-emerald-700">{sale.item_name}</td>
                  <td className="p-5 border-l text-center font-bold text-lg">{sale.quantity_sold}</td>
                  <td className="p-5 border-l text-center">{sale.sale_day_name}</td>
                  <td className="p-5 border-l text-center">{sale.sale_day} {sale.sale_month} {sale.sale_year}</td>
                  <td className="p-5 border-l text-center text-sm">{sale.sale_time}</td>
                  <td className="p-5 text-center">
                    <button 
                      onClick={() => setDeleteId(sale.sale_id)} 
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-3xl font-medium transition-all hover:scale-105"
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
    </div>
  );
}

export default Sales;