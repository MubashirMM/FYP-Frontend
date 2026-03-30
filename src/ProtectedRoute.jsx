import { Link } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center p-6" dir="rtl">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full border-t-4 border-red-500">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">رسائی ممنوع ہے</h2>
          <p className="text-gray-600 mb-6">
            اس صفحے کو دیکھنے کے لیے آپ کا لاگ ان ہونا ضروری ہے۔ براہ کرم پہلے لاگ ان کریں۔
          </p>
          <Link 
            to="/login" 
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            لاگ ان پیج پر جائیں
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;