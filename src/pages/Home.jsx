import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function Home() {
  const [isServerRunning, setIsServerRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Try to hit any existing endpoint - using the root or docs endpoint
      const response = await fetch(`${API}/docs`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 200) {
        setIsServerRunning(true);
        setErrorMessage("");
      } else {
        setIsServerRunning(false);
        setErrorMessage("سرور کام نہیں کر رہا");
      }
    } catch (error) {
      setIsServerRunning(false);
      setErrorMessage("سرور کام نہیں کر رہا");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg text-gray-700 font-urdu">سرور سے رابطہ ہو رہا ہے...</p>
          <p className="text-sm text-gray-500">براہ کرم انتظار کریں</p>
        </div>
      ) : !isServerRunning ? (
        <div className="text-center space-y-6 max-w-md">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 font-urdu">سرور کام نہیں کر رہا</h2>
          <p className="text-gray-600 font-urdu">{errorMessage}</p>
          <p className="text-sm text-gray-500">براہ کرم یقینی بنائیں کہ سرور چل رہا ہے</p>
          <button
            onClick={checkServerConnection}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-urdu"
          >
            دوبارہ کوشش کریں
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 text-center mb-6 font-urdu">
            اسٹور میں خوش آمدید
          </h1><br />
          <div className="flex flex-col gap-4 w-full max-w-md">
            <Link
              to="/register"
              className="border-2 border-gray-900 text-gray-900 py-3 px-6 rounded-lg text-center text-lg font-urdu transition-all hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50"
            >
              اکاؤنٹ بنائیں
            </Link>
            <Link
              to="/login"
              className="border-2 border-gray-900 text-gray-900 py-3 px-6 rounded-lg text-center text-lg font-urdu transition-all hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50"
            >
              لاگ ان کریں
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;