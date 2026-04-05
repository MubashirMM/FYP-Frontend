import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VoiceSamplesForm from "./pages/VoiceSamplesForm";
import VoiceLogin from "./pages/VoiceLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";

import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "./pages/MainLayout";

import MainPage from "./pages/MainPage";
import Items from "./pages/Items";
import Bills from "./pages/Bills";
import UdhaarItems from "./pages/UdhaarItems";
import Udhaars from "./pages/Udhaars";
import Shop from "./pages/Shop";
import BillItems from "./pages/BillItems";
import Profile from "./pages/Profile";
import Sales from "./pages/Sales";
import BillItemHistory from "./pages/BillItemHistory";
import SalesReport from "./pages/SalesReport";
import ForecastReport from "./pages/ForecasttReport";

function App() {
  return (
    <Router> 
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/voice-login" element={<VoiceLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
        <Route path="/voice-samples-form" element={<VoiceSamplesForm />} />

        {/* Protected Dashboard Routes with Sidebar & Header */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/main" element={<MainPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/items" element={<Items />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/udhaar-items" element={<UdhaarItems />} />
          <Route path="/khata" element={<Udhaars />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/bill-items" element={<BillItems />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/bill-item-history" element={<BillItemHistory />} />
          <Route path="/sales-report" element={<SalesReport />} />
           <Route path="forecast-report" element={<ForecastReport />} />

        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;