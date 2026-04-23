// UdhaarVoiceService.js - Dedicated service for Udhaar (Customer Credit Accounts) operations via voice commands
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export class UdhaarVoiceService {
  constructor(showMsgCallback, refreshUdhaarCallback) {
    this.showMsg = showMsgCallback;
    this.refreshUdhaar = refreshUdhaarCallback;
  }

  // Main dispatcher
  async processCommand(commandJson, callbacks) {
    console.log("UdhaarVoiceService processing:", commandJson);

    const {
      onShowUdhaarDetails,
      onPrintUdhaar,
      onPayUdhaar,
      onDirectAddition,
      onDirectDeduction,
      onSearch,
      onShowAllUdhaar,
      onOpenUdhaarPopup
    } = callbacks;

    // Check for invalid action
    if (commandJson.action === 0) {
      this.showMsg(commandJson.message || "❌ یہ کمانڈ یہاں پروسیس نہیں کی جا سکتی۔ براہ کرم صرف ادھار/کھاتہ سے متعلق کمانڈ دیں۔", "error");
      return false;
    }

    switch (commandJson.action) {
      case 1:
        // Direct Addition to customer account
        return this.handleDirectAddition(commandJson, onDirectAddition, onOpenUdhaarPopup);
      case 2:
        // Direct Deduction from customer account
        return this.handleDirectDeduction(commandJson, onDirectDeduction, onOpenUdhaarPopup);
      case 3:
        // Search customer
        return this.handleSearch(commandJson, onSearch, onOpenUdhaarPopup);
      case 4:
        // Udhaar Action: Pay, Print, or View
        if (commandJson.action_type === "pay") {
          return this.handlePay(commandJson, onPayUdhaar, onOpenUdhaarPopup);
        } else if (commandJson.action_type === "print") {
          return this.handlePrint(commandJson, onPrintUdhaar, onOpenUdhaarPopup);
        } else {
          return this.handleViewDetails(commandJson, onShowUdhaarDetails, onOpenUdhaarPopup);
        }
      case 5:
        // Read all udhaar
        return this.handleReadAll(onShowAllUdhaar, onOpenUdhaarPopup);
      default:
        this.showMsg("❌ نامعلوم کمانڈ", "error");
        return false;
    }
  }

  // ✅ DIRECT ADDITION (action: 1) - "ali ke khatay mein 500 daal do"
  async handleDirectAddition(command, onDirectAddition, onOpenUdhaarPopup) {
    if (!command.customer_name) {
      this.showMsg("❌ کسٹمر کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }
    
    if (!command.amount || command.amount <= 0) {
      this.showMsg("❌ رقم درج نہیں ہے یا غلط ہے۔ براہ کرم صحیح رقم بولیں", "error");
      return false;
    }

    const formData = {
      customer_name: command.customer_name,
      amount: command.amount,
      type: "addition"
    };

    onDirectAddition(formData);
    onOpenUdhaarPopup();
    this.showMsg(`📝 "${command.customer_name}" کے کھاتے میں ${command.amount} روپے جمع کرنے کا فارم کھل رہا ہے`, "success");
    return true;
  }

  // ❌ DIRECT DEDUCTION (action: 2) - "ali ke khatay se 300 nikaal do"
  async handleDirectDeduction(command, onDirectDeduction, onOpenUdhaarPopup) {
    if (!command.customer_name) {
      this.showMsg("❌ کسٹمر کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }
    
    if (!command.amount || command.amount <= 0) {
      this.showMsg("❌ رقم درج نہیں ہے یا غلط ہے۔ براہ کرم صحیح رقم بولیں", "error");
      return false;
    }

    const formData = {
      customer_name: command.customer_name,
      amount: command.amount,
      type: "deduction"
    };

    onDirectDeduction(formData);
    onOpenUdhaarPopup();
    this.showMsg(`📝 "${command.customer_name}" کے کھاتے سے ${command.amount} روپے کٹوتی کا فارم کھل رہا ہے`, "success");
    return true;
  }

  // 🔍 SEARCH (action: 3) - "ali ka udhaar dhundo"
  async handleSearch(command, onSearch, onOpenUdhaarPopup) {
    if (!command.customer_name) {
      this.showMsg("❌ کسٹمر کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }

    onSearch(command.customer_name);
    onOpenUdhaarPopup();
    this.showMsg(`🔍 "${command.customer_name}" تلاش کیا جا رہا ہے`, "success");
    return true;
  }

  // 💰 PAY UDHAAR (action: 4 with action_type: "pay") - "ali ka udhaar ada karo"
  async handlePay(command, onPayUdhaar, onOpenUdhaarPopup) {
    if (!command.customer_name) {
      this.showMsg("❌ کسٹمر کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }

    onPayUdhaar(command.customer_name);
    onOpenUdhaarPopup();
    this.showMsg(`💰 "${command.customer_name}" کا اُدھار ادا کرنے کی کارروائی ہو رہی ہے`, "success");
    return true;
  }

  // 🖨️ PRINT UDHAAR (action: 4 with action_type: "print") - "ali ka udhaar print karo"
  async handlePrint(command, onPrintUdhaar, onOpenUdhaarPopup) {
    if (!command.customer_name) {
      this.showMsg("❌ کسٹمر کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }

    onPrintUdhaar(command.customer_name);
    this.showMsg(`🖨️ "${command.customer_name}" کا اُدھار پرنٹ کیا جا رہا ہے`, "success");
    return true;
  }

  // 👁️ VIEW UDHAAR DETAILS (action: 4 with action_type: "view") - "ali ka udhaar dikhao / kitna hai"
  async handleViewDetails(command, onShowUdhaarDetails, onOpenUdhaarPopup) {
    if (!command.customer_name) {
      this.showMsg("❌ کسٹمر کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }

    onShowUdhaarDetails(command.customer_name);
    onOpenUdhaarPopup();
    this.showMsg(`👁️ "${command.customer_name}" کا اُدھار دکھایا جا رہا ہے`, "success");
    return true;
  }

  // 📋 READ ALL UDHAAR (action: 5) - "sara udhaar dikhao"
  async handleReadAll(onShowAllUdhaar, onOpenUdhaarPopup) {
    onShowAllUdhaar();
    onOpenUdhaarPopup();
    this.showMsg("📋 تمام کسٹمرز کے اُدھار کی فہرست کھل رہی ہے", "success");
    return true;
  }

  // Execute direct addition after form confirmation
  async executeDirectAddition(customerName, amount) {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/udhars/${encodeURIComponent(customerName)}/direct-addition`,
        null,
        { params: { amount: parseFloat(amount) }, headers: { Authorization: `Bearer ${token}` } }
      );
      
      this.showMsg(`✅ "${customerName}" کے کھاتے میں ${amount} روپے جمع کر دیے گئے`, "success");
      if (this.refreshUdhaar) await this.refreshUdhaar();
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "جمع کرنے میں خرابی";
      this.showMsg(`❌ ${errorMsg}`, "error");
      return false;
    }
  }

  // Execute direct deduction after form confirmation
  async executeDirectDeduction(customerName, amount) {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/udhars/${encodeURIComponent(customerName)}/direct-deduction`,
        null,
        { params: { amount: parseFloat(amount) }, headers: { Authorization: `Bearer ${token}` } }
      );
      
      this.showMsg(`✅ "${customerName}" کے کھاتے سے ${amount} روپے کٹوتی کر دی گئی`, "success");
      if (this.refreshUdhaar) await this.refreshUdhaar();
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "کٹوتی کرنے میں خرابی";
      this.showMsg(`❌ ${errorMsg}`, "error");
      return false;
    }
  }

  // Execute pay udhaar
  async executePay(customerName) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/udhars/pay`, null, { 
        params: { customer_name: customerName }, 
        headers: { Authorization: `Bearer ${token}` }
      });
      
      this.showMsg(response.data.message || `✅ "${customerName}" کا اُدھار ادا کر دیا گیا`, "success");
      if (this.refreshUdhaar) await this.refreshUdhaar();
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "ادائیگی ناکام";
      this.showMsg(`❌ ${errorMsg}`, "error");
      return false;
    }
  }

  // Get udhaar details for printing/viewing
  async getUdhaarDetails(customerName) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/udhars/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const udhaars = response.data || [];
      const foundUdhaar = udhaars.find(u => 
        u.customer_name?.toLowerCase() === customerName.toLowerCase()
      );
      
      return foundUdhaar;
    } catch (err) {
      this.showMsg(err.response?.data?.detail || "اُدھار ڈھونڈنے میں خرابی", "error");
      return null;
    }
  }
}