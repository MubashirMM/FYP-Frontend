import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function BillItemHistory() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

  // Fetch all items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/bill-items-history`, getAuthHeader());
      const data = response.data || [];
      setItems(data);
      setFilteredItems(data);
    } catch (err) {
      showMsg(err.response?.data?.detail || "آئٹمز حاصل نہیں ہو سکے", "error");
    } finally {
      setLoading(false);
    }
  };

  // Search items in real-time
  const handleSearchChange = async (query) => {
    setSearch(query);
    
    if (!query.trim()) {
      setFilteredItems(items);
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/bill-items-history/search`, {
        params: { item_name: query },
        ...getAuthHeader()
      });
      const data = response.data || [];
      setFilteredItems(data);
    } catch (err) {
      console.error("Search error:", err);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const getEmptyMessage = () => {
    if (search) return `"${search}" کے نام سے کوئی آئٹم نہیں ملا`;
    return "کوئی بل آئٹم ہسٹری موجود نہیں ہے";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6" dir="rtl">
      {message.text && (
        <div className={`fixed top-6 left-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-5 rounded-t-3xl shadow-sm border-b">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800">بل آئٹم ہسٹری</h2>
            <p className="text-gray-500">کل آئٹمز: {filteredItems.length}</p>
          </div>
          <div className="flex-1 md:max-w-md relative">
            <input 
              type="text" 
              placeholder="آئٹم کے نام سے تلاش کریں..." 
              value={search} 
              onChange={(e) => handleSearchChange(e.target.value)} 
              className="w-full p-4 border-2 border-gray-200 rounded-3xl focus:border-blue-500 outline-none pr-12"
            />
            {search && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-b-3xl overflow-hidden border overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-5 border-l font-bold text-center">بل ہسٹری نمبر</th>
              <th className="p-5 border-l font-bold text-center">بل نمبر</th>
              <th className="p-5 border-l font-bold">آئٹم کا نام</th>
              <th className="p-5 border-l font-bold text-center">یونٹ قیمت</th>
              <th className="p-5 border-l font-bold text-center">مقدار</th>
              <th className="p-5 border-l font-bold text-center">یونٹ</th>
              <th className="p-5 text-center font-bold">کل قیمت</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-20 text-center text-gray-400">لوڈ ہو رہا ہے...</td>
              </tr>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.history_id} className="border-b hover:bg-blue-50 transition-colors">
                  <td className="p-5 border-l text-center font-mono">{item.history_id}</td>
                  <td className="p-5 border-l text-center font-mono">#{item.bill_id}</td>
                  <td className="p-5 border-l font-bold text-blue-700">{item.item_name}</td>
                  <td className="p-5 border-l text-center">{item.unit_price}</td>
                  <td className="p-5 border-l text-center font-bold">{item.quantity}</td>
                  <td className="p-5 border-l text-center">{item.requested_unit}</td>
                  <td className="p-5 text-center font-bold text-green-700">{item.total_amount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-4xl">
                      📋
                    </div>
                    <p className="text-gray-500 text-lg font-medium">{getEmptyMessage()}</p>
                    {search && (
                      <button 
                        onClick={() => handleSearchChange("")}
                        className="text-blue-600 hover:text-blue-700 font-bold underline"
                      >
                        تمام آئٹمز دیکھیں
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

export default BillItemHistory;