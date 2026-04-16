import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function SalesReport({ onClose }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [printGenerating, setPrintGenerating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [shopInfo, setShopInfo] = useState({ shop_name: "میرا اسٹور", owner_name: "", address: "" });
  const [user, setUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

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

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/reports/`, getAuthHeader());
      setReports(res.data || []);
    } catch (err) {
      console.error("Failed to fetch reports", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      await axios.post(`${API}/reports/generate`, {}, getAuthHeader());
      showMsg("✅ رپورٹ کامیابی سے جنریٹ ہو گئی", "success");
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
      const response = await axios.get(`${API}/reports/download-excel/${reportId}`, {
        ...getAuthHeader(),
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_report_${reportId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showMsg("📊 ایکسل فائل ڈاؤن لوڈ ہو رہی ہے", "success");
    } catch (err) {
      showMsg("ایکسل ڈاؤن لوڈ نہیں ہو سکی", "error");
    }
  };

  // Handle Delete Report
  const handleDeleteReport = async () => {
    setDeleteError("");
    try {
      await axios.delete(`${API}/reports/${deleteId}`, getAuthHeader());
      showMsg("✅ رپورٹ کامیابی سے حذف کر دی گئی", "success");
      setDeleteId(null);
      await fetchReports();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "حذف کرنے میں خرابی";
      setDeleteError(errorMsg);
    }
  };

  // Generate Bar Chart as Data URL
  const generateBarChartImage = (topItems) => {
    return new Promise((resolve) => {
      if (!topItems || topItems.length === 0) {
        resolve('');
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      const items = topItems.slice(0, 5);
      const maxQuantity = Math.max(...items.map(i => i[1]));
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width - 100) / items.length - 10;
      const maxBarHeight = canvas.height - 100;
      
      items.forEach((item, index) => {
        const barHeight = (item[1] / maxQuantity) * maxBarHeight;
        const x = 50 + index * (barWidth + 15);
        const y = canvas.height - 60 - barHeight;
        
        ctx.fillStyle = '#2C7DA0';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.strokeStyle = '#1a5a7a';
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        ctx.fillStyle = '#333';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item[1].toLocaleString(), x + barWidth / 2, y - 5);
        
        let name = item[0];
        if (name.length > 15) name = name.substring(0, 12) + '...';
        ctx.fillStyle = '#666';
        ctx.font = '9px Arial';
        ctx.fillText(name, x + barWidth / 2, canvas.height - 40);
      });
      
      ctx.beginPath();
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.moveTo(40, canvas.height - 60);
      ctx.lineTo(canvas.width - 20, canvas.height - 60);
      ctx.stroke();
      ctx.moveTo(40, 20);
      ctx.lineTo(40, canvas.height - 60);
      ctx.stroke();
      
      ctx.fillStyle = '#2C7DA0';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('سب سے زیادہ فروخت ہونے والی اشیاء', canvas.width / 2, 25);
      
      resolve(canvas.toDataURL());
    });
  };
  
  // Generate Pie Chart with Legend
  const generatePieChartImage = (topItems) => {
    return new Promise((resolve) => {
      if (!topItems || topItems.length === 0) {
        resolve('');
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = 650;
      canvas.height = 450;
      const ctx = canvas.getContext('2d');
      
      const colors = ['#2C7DA0', '#E76F51', '#2A9D8F', '#E9C46A', '#8338EC'];
      const centerX = canvas.width / 2 - 60;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) / 3;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const total = topItems.reduce((sum, item) => sum + item[1], 0);
      let startAngle = -Math.PI / 2;
      const legendItems = [];
      
      topItems.slice(0, 5).forEach((item, index) => {
        const angle = (item[1] / total) * Math.PI * 2;
        const endAngle = startAngle + angle;
        const color = colors[index % colors.length];
        
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
        
        const midAngle = startAngle + angle / 2;
        const labelRadius = radius * 0.65;
        const x = centerX + Math.cos(midAngle) * labelRadius;
        const y = centerY + Math.sin(midAngle) * labelRadius;
        const percentage = ((item[1] / total) * 100).toFixed(1);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`${percentage}%`, x - 12, y + 4);
        
        legendItems.push({
          name: item[0],
          color: color,
          value: item[1],
          percentage: percentage
        });
        
        startAngle = endAngle;
      });
      
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.arc(centerX, centerY, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#2C7DA0';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('مارکیٹ شیئر کی تقسیم', canvas.width / 2, 30);
      
      const legendX = canvas.width - 170;
      let legendY = 80;
      
      ctx.fillStyle = '#333';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('اشیاء کی تفصیل', legendX + 60, legendY - 10);
      
      legendItems.forEach((item, idx) => {
        const yPos = legendY + (idx * 45);
        
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, yPos, 20, 20);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(legendX, yPos, 20, 20);
        
        ctx.fillStyle = '#333';
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        let name = item.name;
        if (name.length > 20) name = name.substring(0, 17) + '...';
        ctx.fillText(name, legendX + 115, yPos + 15);
        
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.fillText(`${item.percentage}% (${item.value.toLocaleString()})`, legendX + 115, yPos + 30);
      });
      
      resolve(canvas.toDataURL());
    });
  };
  
  // Generate Line Chart
  const generateLineChartImage = (sales) => {
    return new Promise((resolve) => {
      const dailySales = {};
      sales.forEach(sale => {
        const date = new Date(sale.sale_date).toLocaleDateString('ur-PK');
        const amount = (sale.quantity_sold || 0) * (sale.unit_price || 0);
        if (!dailySales[date]) {
          dailySales[date] = 0;
        }
        dailySales[date] += amount;
      });
      
      const dates = Object.keys(dailySales).slice(-10);
      const amounts = dates.map(d => dailySales[d]);
      
      if (dates.length === 0) {
        resolve('');
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = 650;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const padding = 50;
      const graphWidth = canvas.width - 2 * padding;
      const graphHeight = canvas.height - 2 * padding;
      const maxAmount = Math.max(...amounts, 1);
      
      ctx.beginPath();
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, canvas.height - padding);
      ctx.lineTo(canvas.width - padding, canvas.height - padding);
      ctx.stroke();
      
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = padding + (graphHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
      }
      
      if (amounts.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#2C7DA0';
        ctx.lineWidth = 3;
        
        amounts.forEach((amount, index) => {
          const x = padding + (graphWidth / (amounts.length - 1)) * index;
          const y = canvas.height - padding - (amount / maxAmount) * graphHeight;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
        
        amounts.forEach((amount, index) => {
          const x = padding + (graphWidth / (amounts.length - 1)) * index;
          const y = canvas.height - padding - (amount / maxAmount) * graphHeight;
          
          ctx.beginPath();
          ctx.fillStyle = '#E76F51';
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.fillStyle = '#333';
          ctx.font = 'bold 9px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Rs. ${amount.toLocaleString()}`, x, y - 10);
        });
      }
      
      ctx.fillStyle = '#666';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      dates.forEach((date, index) => {
        const x = padding + (graphWidth / (dates.length - 1)) * index;
        ctx.fillText(date, x, canvas.height - padding + 15);
      });
      
      ctx.fillStyle = '#2C7DA0';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('وقت کے ساتھ فروخت کا رجحان', canvas.width / 2, 25);
      
      resolve(canvas.toDataURL());
    });
  };

  // Print-based PDF generation
  const printPDF = async (report) => {
    setPrintGenerating(true);
    try {
      showMsg("📄 رپورٹ تیار ہو رہی ہے... براہ کرم انتظار کریں", "success");
      
      const response = await axios.get(`${API}/reports/${report.report_id}`, getAuthHeader());
      const reportData = response.data;
      
      const salesRes = await axios.get(`${API}/sales/`, getAuthHeader());
      const allSales = salesRes.data || [];
      
      const kpi = reportData.kpi_summary || {};
      const topItems = kpi.top_5_items || [];
      
      const barChartImage = await generateBarChartImage(topItems);
      const pieChartImage = await generatePieChartImage(topItems);
      const lineChartImage = await generateLineChartImage(allSales);
      
      const htmlContent = generatePrintHTML(reportData, kpi, allSales, shopInfo, user, {
        barChart: barChartImage,
        pieChart: pieChartImage,
        lineChart: lineChartImage
      });
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          showMsg("✅ رپورٹ پرنٹ کے لیے تیار ہے۔ Save as PDF کا انتخاب کریں", "success");
          setPrintGenerating(false);
        }, 500);
      };
      
    } catch (err) {
      console.error("Print error:", err);
      showMsg("رپورٹ تیار نہیں ہو سکی", "error");
      setPrintGenerating(false);
    }
  };

  // HTML for Print
  const generatePrintHTML = (report, kpi, sales, shop, user, charts) => {
    const totalQuantity = kpi.total_quantity || 0;
    const totalRevenue = kpi.total_revenue || 0;
    const totalTransactions = kpi.total_transactions || 0;
    const uniqueItems = kpi.unique_items || 0;
    const topItems = kpi.top_5_items || [];
    const avgPerTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    const itemSummary = {};
    sales.forEach(sale => {
      if (!itemSummary[sale.item_name]) {
        itemSummary[sale.item_name] = {
          quantity: 0,
          revenue: 0,
          count: 0,
          unit: sale.item_unit || "-"
        };
      }
      const saleTotal = (sale.quantity_sold || 0) * (sale.unit_price || 0);
      itemSummary[sale.item_name].quantity += sale.quantity_sold || 0;
      itemSummary[sale.item_name].revenue += saleTotal;
      itemSummary[sale.item_name].count++;
    });
    
    const totalAllQuantity = Object.values(itemSummary).reduce((sum, item) => sum + item.quantity, 0);
    
    const hasBarChart = charts.barChart && charts.barChart !== '';
    const hasPieChart = charts.pieChart && charts.pieChart !== '';
    const hasLineChart = charts.lineChart && charts.lineChart !== '';
    
    return `<!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>فروخت رپورٹ</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Noto Nastaliq Urdu', 'Arial', 'Tahoma', serif;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px;
          background: #ffffff;
          color: #333333;
          font-size: 13px;
          line-height: 1.6;
        }
        
        @media print {
          body { margin: 0; padding: 15px; }
          .page-break { page-break-before: always; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        
        .container { width: 100%; }
        
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2C7DA0; padding-bottom: 20px; }
        .shop-name { font-size: 26px; font-weight: bold; color: #2C7DA0; margin-bottom: 8px; }
        .shop-address { color: #666666; font-size: 11px; }
        .report-title { font-size: 22px; font-weight: bold; color: #1e3a5f; margin: 15px 0 5px; }
        .report-date { color: #888888; font-size: 11px; }
        
        .kpi-grid { display: flex; flex-wrap: wrap; gap: 15px; margin: 25px 0; }
        .kpi-card { flex: 1 1 200px; color: #ffffff; padding: 15px; border-radius: 12px; text-align: center; }
        .kpi-card.blue { background: #2C7DA0; }
        .kpi-card.green { background: #2A9D8F; }
        .kpi-card.orange { background: #E76F51; }
        .kpi-card.purple { background: #8338EC; }
        .kpi-card.teal { background: #20B2AA; }
        .kpi-label { font-size: 12px; opacity: 0.9; margin-bottom: 6px; }
        .kpi-value { font-size: 24px; font-weight: bold; }
        
        .section-title { font-size: 18px; font-weight: bold; color: #2C7DA0; margin: 25px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #2C7DA0; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
        th { background: #2C7DA0; color: #ffffff; padding: 10px 8px; border: 1px solid #1a5a7a; }
        td { padding: 8px; border: 1px solid #dddddd; text-align: center; }
        tr:nth-child(even) { background: #f9f9f9; }
        .amount { font-weight: bold; color: #2C7DA0; }
        
        .page-break { page-break-before: always; margin-top: 30px; }
        .chart-container { text-align: center; margin: 20px 0; padding: 20px; background: #ffffff; border-radius: 12px; }
        .chart-title { font-size: 20px; font-weight: bold; color: #2C7DA0; margin-bottom: 15px; }
        .chart-description { color: #666666; font-size: 13px; line-height: 1.8; margin: 15px auto; max-width: 80%; text-align: center; }
        .chart-image { text-align: center; margin: 20px 0; }
        .chart-image img { max-width: 100%; height: auto; border: 1px solid #dddddd; border-radius: 8px; }
        
        .footer { text-align: center; margin-top: 40px; padding-top: 15px; border-top: 1px solid #dddddd; color: #999999; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="shop-name">${shop.shop_name || "میرا اسٹور"}</div>
          <div class="shop-address">${shop.address || ""}</div>
          <div class="shop-address">مالک: ${shop.owner_name || user?.username || ""}</div>
          <div class="report-title">📊 فروخت رپورٹ</div>
          <div class="report-date">تاریخ: ${report.report_full_date || new Date().toLocaleDateString('ur-PK')}</div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card blue"><div class="kpi-label">کل فروخت مقدار</div><div class="kpi-value">${totalQuantity.toLocaleString()}</div></div>
          <div class="kpi-card green"><div class="kpi-label">کل آمدنی</div><div class="kpi-value">Rs. ${totalRevenue.toLocaleString()}</div></div>
          <div class="kpi-card orange"><div class="kpi-label">کل لین دین</div><div class="kpi-value">${totalTransactions.toLocaleString()}</div></div>
          <div class="kpi-card purple"><div class="kpi-label">منفرد اشیاء</div><div class="kpi-value">${uniqueItems.toLocaleString()}</div></div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card teal"><div class="kpi-label">اوسط فروخت فی لین دین</div><div class="kpi-value">Rs. ${avgPerTransaction.toLocaleString()}</div></div>
          <div class="kpi-card blue"><div class="kpi-label">کل مختلف کسٹمرز</div><div class="kpi-value">${new Set(sales.map(s => s.customer_name).filter(Boolean)).size}</div></div>
        </div>

        <div class="section-title">🏆 پانچ سب سے زیادہ فروخت ہونے والی اشیاء</div>
        <table>
          <thead><tr><th>درجہ</th><th>آئٹم کا نام</th><th>فروخت مقدار</th><th>کل آمدنی</th><th>مارکیٹ شیئر %</th></tr></thead>
          <tbody>
            ${topItems.map((item, idx) => {
              const marketShare = totalAllQuantity > 0 ? ((item[1] / totalAllQuantity) * 100).toFixed(1) : 0;
              return `<tr>
                <td>${idx + 1}</td>
                <td style="text-align:right">${item[0]}</td>
                <td>${item[1].toLocaleString()}</td>
                <td class="amount">Rs. ${item[2].toLocaleString()}</td>
                <td>${marketShare}%</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>

        ${hasBarChart ? `<div class="page-break"><div class="chart-container"><div class="chart-title">📊 بار چارٹ: فروخت شدہ مقدار کا موازنہ</div><div class="chart-description">یہ بار چارٹ پانچ سب سے زیادہ فروخت ہونے والی اشیاء کی مقدار دکھاتا ہے۔</div><div class="chart-image"><img src="${charts.barChart}" alt="Bar Chart" /></div></div></div>` : ''}

        ${hasPieChart ? `<div class="page-break"><div class="chart-container"><div class="chart-title">🥧 پائی چارٹ: فروخت میں حصہ داری</div><div class="chart-description">یہ پائی چارٹ ظاہر کرتا ہے کہ ہر آئٹم کا کل فروخت میں کتنا فیصد حصہ ہے۔</div><div class="chart-image"><img src="${charts.pieChart}" alt="Pie Chart" /></div></div></div>` : ''}

        ${hasLineChart ? `<div class="page-break"><div class="chart-container"><div class="chart-title">📈 لائن چارٹ: فروخت کا رجحان</div><div class="chart-description">یہ لائن چارٹ وقت کے ساتھ فروخت میں تبدیلی کو ظاہر کرتا ہے۔</div><div class="chart-image"><img src="${charts.lineChart}" alt="Line Chart" /></div></div></div>` : ''}

        <div class="footer">
          <p>شکریہ! یہ رپورٹ سسٹم سے خودکار طور پر جنریٹ کی گئی ہے۔</p>
          <p>تخلیق شدہ: ${new Date().toLocaleString('ur-PK')}</p>
        </div>
      </div>
    </body>
    </html>`;
  };

  const deleteReport = async (reportId) => {
    setDeleteId(reportId);
  };

  useEffect(() => {
    fetchReports();
    fetchShopInfo();
    fetchUser();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReports = reports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reports.length / itemsPerPage);
  
  return (
    <div className="relative min-h-screen bg-gray-50 p-3 md:p-6" dir="rtl">
      {/* PDF Generation Loader */}
      {printGenerating && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">رپورٹ تیار ہو رہی ہے</h3>
            <p className="text-gray-500">براہ کرم انتظار کریں...</p>
          </div>
        </div>
      )}

      {/* Toast Message - FIXED: Shows full message */}
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
            <p className="text-gray-500 text-sm mb-6">یہ رپورٹ ہمیشہ کے لیے حذف ہو جائے گی۔</p>
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
            <h2 className="text-2xl font-black text-gray-800">📊 فروخت رپورٹس</h2>
            <p className="text-gray-500">کل رپورٹس: {reports.length}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={generateReport} disabled={generating || printGenerating} className="px-6 py-3 rounded-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg disabled:opacity-50">
              {generating ? "⏳ جنریٹ ہو رہا ہے..." : "🔄 نیا رپورٹ جنریٹ کریں"}
            </button>
            {/* <button onClick={onClose} disabled={printGenerating} className="px-6 py-3 rounded-3xl font-bold bg-gray-500 text-white hover:bg-gray-600 transition-all">✕ بند کریں</button> */}
          </div>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
          <p className="text-amber-800 text-sm">💡 نوٹ: رپورٹ جنریٹ کرنے کے لیے کم از کم 5 مختلف اشیاء کی فروخت ضروری ہے۔ ہر رپورٹ میں آپ کی تمام فروخت کا تفصیلی تجزیہ شامل ہوتا ہے۔</p>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-b-3xl overflow-hidden border overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-5 border-l font-bold">رپورٹ آئی ڈی</th>
              <th className="p-5 border-l font-bold">عنوان</th>
              <th className="p-5 border-l font-bold">کل فروخت</th>
              <th className="p-5 border-l font-bold">کل آمدنی</th>
              <th className="p-5 border-l font-bold">تخلیق تاریخ</th>
              <th className="p-5 text-center font-bold">عمل</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-20 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>لوڈ ہو رہا ہے...</span>
                  </div>
                </td>
              </tr>
            ) : currentReports.length > 0 ? (
              currentReports.map((report) => (
                <tr key={report.report_id} className="border-b hover:bg-amber-50 transition-colors">
                  <td className="p-5 border-l text-center font-mono">#{report.report_id}</td>
                  <td className="p-5 border-l text-right">{report.title || "فروخت رپورٹ"}</td>
                  <td className="p-5 border-l text-center font-bold text-amber-700">
                    {report.kpi_summary?.total_quantity?.toLocaleString() || 0}
                  </td>
                  <td className="p-5 border-l text-center font-bold text-green-600">
                    Rs. {report.kpi_summary?.total_revenue?.toLocaleString() || 0}
                  </td>
                  <td className="p-5 border-l text-center text-sm">
                    {report.report_full_date || (report.created_at ? new Date(report.created_at).toLocaleDateString('ur-PK') : "—")}
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex gap-2 justify-center flex-wrap">
                      <button onClick={() => printPDF(report)} disabled={printGenerating} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-2xl font-medium text-sm transition-all disabled:opacity-50">
                        {printGenerating ? "⏳..." : "🖨️ پرنٹ / پی ڈی ایف"}
                      </button>
                      <button onClick={() => downloadExcel(report.report_id)} disabled={printGenerating} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-2xl font-medium text-sm transition-all disabled:opacity-50">
                        📊 ایکسل
                      </button>
                      <button onClick={() => deleteReport(report.report_id)} disabled={printGenerating} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-2xl font-medium text-sm transition-all disabled:opacity-50">
                        🗑️ حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-4xl">📊</div>
                    <p className="text-gray-500 text-lg font-medium">کوئی رپورٹ موجود نہیں ہے</p>
                    <button onClick={generateReport} className="text-amber-600 hover:text-amber-700 font-bold underline">
                      نیا رپورٹ جنریٹ کریں
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
            disabled={currentPage === 1 || printGenerating}
            className="h-8 w-8 rounded-lg border font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-100"
          >
            ←
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              disabled={printGenerating}
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
            disabled={currentPage === totalPages || printGenerating}
            className="h-8 w-8 rounded-lg border font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-100"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

export default SalesReport;