import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function ForecastReport({ onClose }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [forecastDays, setForecastDays] = useState(7);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/forecast-report/list`, getAuthHeader());
      setReports(res.data.reports || []);
    } catch (err) {
      console.error("Failed to fetch forecast reports", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (forecastDays < 7) {
      showMsg("پیشن گوئی کے لیے کم از کم 7 دن ضروری ہیں", "error");
      return;
    }
    
    setGenerating(true);
    try {
      const response = await axios.post(`${API}/forecast-report/generate/${forecastDays}`, {}, getAuthHeader());
      showMsg(`✅ پیشن گوئی رپورٹ جنریشن شروع ہو گئی ہے (${forecastDays} دن)`, "success");
      await fetchReports();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "رپورٹ جنریٹ نہیں ہو سکی";
      showMsg(errorMsg, "error");
    } finally {
      setGenerating(false);
    }
  };

  const downloadExcel = async (reportId) => {
    try {
      const response = await axios.get(`${API}/forecast-report/download/${reportId}`, {
        ...getAuthHeader(),
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `forecast_report_${reportId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showMsg("📊 پیشن گوئی رپورٹ ڈاؤن لوڈ ہو رہی ہے", "success");
    } catch (err) {
      showMsg("رپورٹ ڈاؤن لوڈ نہیں ہو سکی", "error");
    }
  };

  const handleDeleteReport = async () => {
    setDeleteError("");
    try {
      await axios.delete(`${API}/forecast-report/${deleteId}`, getAuthHeader());
      showMsg("✅ رپورٹ کامیابی سے حذف کر دی گئی", "success");
      setDeleteId(null);
      await fetchReports();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "حذف کرنے میں خرابی";
      setDeleteError(errorMsg);
    }
  };

  const deleteReport = (reportId) => {
    setDeleteId(reportId);
  };

  const getStatusBadge = (status) => {
    if (status === "completed") {
      return <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">مکمل</span>;
    } else if (status === "processing") {
      return <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">پروسیسنگ</span>;
    } else if (status === "failed") {
      return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">ناکام</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReports = reports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reports.length / itemsPerPage);
  
  return (
    <div className="relative min-h-screen bg-gray-50 p-3 md:p-6" dir="rtl">
      {/* Toast Message */}
      {message.text && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl animate-slide-down text-sm md:text-base transition-all duration-300"
          style={{
            backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{message.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-urdu">{message.text}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[400] flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2">کیا آپ کو یقین ہے؟</h3>
            <p className="text-gray-500 text-sm mb-6">یہ پیشن گوئی رپورٹ ہمیشہ کے لیے حذف ہو جائے گی۔</p>
            {deleteError && <div className="mb-4 p-3 rounded-xl text-center bg-red-100 text-red-700 border border-red-400 text-sm">❌ {deleteError}</div>}
            <div className="flex gap-3">
              <button onClick={handleDeleteReport} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 text-sm transition-all">ہاں، حذف کریں</button>
              <button onClick={() => { setDeleteId(null); setDeleteError(""); }} className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 text-sm transition-all">منسوخ</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-t-3xl shadow-sm border-b">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800">🔮 فروخت کی پیشن گوئی رپورٹس</h2>
            <p className="text-gray-500">کل رپورٹس: {reports.length}</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2">
              <label className="text-sm font-bold text-gray-700">پیشن گوئی دن:</label>
              <input
                type="number"
                min="7"
                max="90"
                value={forecastDays}
                onChange={(e) => setForecastDays(parseInt(e.target.value) || 7)}
                className="w-20 px-3 py-2 border rounded-xl text-center focus:border-amber-500 outline-none"
              />
            </div>
            <button 
              onClick={generateReport} 
              disabled={generating} 
              className="px-6 py-3 rounded-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg disabled:opacity-50"
            >
              {generating ? "⏳ جنریٹ ہو رہا ہے..." : "🔮 نیا پیشن گوئی رپورٹ"}
            </button>
            {/* <button onClick={onClose} disabled={generating} className="px-6 py-3 rounded-3xl font-bold bg-gray-500 text-white hover:bg-gray-600 transition-all">✕ بند کریں</button> */}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
          <p className="text-blue-800 text-sm">💡 نوٹ: پیشن گوئی رپورٹ صرف ان اشیاء کا تجزیہ کرتی ہے جن کی کم از کم 3 سیلز موجود ہوں۔ کم از کم 7 دن کی پیشن گوئی کے لیے 7 دن منتخب کریں۔</p>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-b-3xl overflow-hidden border overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-5 border-l font-bold">رپورٹ آئی ڈی</th>
              <th className="p-5 border-l font-bold">مدت</th>
              <th className="p-5 border-l font-bold">تجزیہ شدہ اشیاء</th>
              <th className="p-5 border-l font-bold">📈 بڑھنے والی</th>
              <th className="p-5 border-l font-bold">📉 گھٹنے والی</th>
              <th className="p-5 border-l font-bold">اسٹیٹس</th>
              <th className="p-5 border-l font-bold">تخلیق تاریخ</th>
              <th className="p-5 text-center font-bold">عمل</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="p-20 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>لوڈ ہو رہا ہے...</span>
                  </div>
                 </td>
               </tr>
            ) : currentReports.length > 0 ? (
              currentReports.map((report) => (
                <tr key={report.id} className="border-b hover:bg-amber-50 transition-colors">
                  <td className="p-5 border-l text-center font-mono text-sm">#{report.id}</td>
                  <td className="p-5 border-l text-center">
                    {report.forecast_days ? `${report.forecast_days} دن` : report.period_type || "—"}
                  </td>
                  <td className="p-5 border-l text-center font-bold">
                    {report.total_items_analyzed || 0}
                  </td>
                  <td className="p-5 border-l text-center text-green-600 font-bold">
                    +{report.increasing_count || 0}
                  </td>
                  <td className="p-5 border-l text-center text-red-600 font-bold">
                    -{report.decreasing_count || 0}
                  </td>
                  <td className="p-5 border-l text-center">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="p-5 border-l text-center text-sm">
                    {report.generated_at ? new Date(report.generated_at).toLocaleDateString('ur-PK') : "—"}
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex gap-2 justify-center flex-wrap">
                      <button 
                        onClick={() => downloadExcel(report.id)} 
                        disabled={report.status !== "completed"} 
                        className={`px-3 py-2 rounded-2xl font-medium text-sm transition-all ${report.status === "completed" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                      >
                        📊 ایکسل
                      </button>
                      <button 
                        onClick={() => deleteReport(report.id)} 
                        disabled={report.status === "processing"} 
                        className={`px-3 py-2 rounded-2xl font-medium text-sm transition-all ${report.status !== "processing" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-4xl">🔮</div>
                    <p className="text-gray-500 text-lg font-medium">کوئی پیشن گوئی رپورٹ موجود نہیں ہے</p>
                    <button onClick={generateReport} className="text-amber-600 hover:text-amber-700 font-bold underline">
                      نیا پیشن گوئی رپورٹ جنریٹ کریں
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-2 bg-white p-4 rounded-xl shadow">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || generating}
            className="h-8 w-8 rounded-lg border font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-100"
          >
            ←
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              disabled={generating}
              className={`h-8 w-8 rounded-lg border font-bold transition-all text-sm ${
                currentPage === i + 1
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white hover:bg-gray-100"
              } disabled:opacity-50`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || generating}
            className="h-8 w-8 rounded-lg border font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-100"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

export default ForecastReport;