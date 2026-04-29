// BillsVoiceService.js - Dedicated service for Bills operations via voice commands
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export class BillsVoiceService {
  constructor(showMsgCallback, refreshBillsCallback) {
    this.showMsg = showMsgCallback;
    this.refreshBills = refreshBillsCallback;
  }

  // Main dispatcher
  async processCommand(commandJson, callbacks) {
    console.log("BillsVoiceService processing:", commandJson);

    const {
      onCreateBill,
      onSearchBill,
      onPayBill,
      onPrintBill,
      onViewBill,
      onOpenBillsPopup
    } = callbacks;

    // Check for invalid action
    if (commandJson.action === 0) {
      this.showMsg(commandJson.message || "❌ یہ کمانڈ یہاں پروسیس نہیں کی جا سکتی۔ براہ کرم صرف بل سے متعلق کمانڈ دیں۔", "error");
      return false;
    }

    switch (commandJson.action) {
      case 1:
        // Create new bill
        return this.handleCreateBill(commandJson, onCreateBill, onOpenBillsPopup);
      case 2:
        // Search bill by customer name
        return this.handleSearchBill(commandJson, onSearchBill, onOpenBillsPopup);
      case 3:
        // Pay bill
        return this.handlePayBill(commandJson, onPayBill, onOpenBillsPopup);
      case 4:
        // Print bill
        return this.handlePrintBill(commandJson, onPrintBill);
      case 5:
        // View bill details
        return this.handleViewBill(commandJson, onViewBill, onOpenBillsPopup);
      default:
        this.showMsg("❌ نامعلوم کمانڈ", "error");
        return false;
    }
  }

  // ✅ CREATE BILL (action: 1) - "ali ka bill bana do"
  async handleCreateBill(command, onCreateBill, onOpenBillsPopup) {
    if (!command.customer_name) {
      this.showMsg("❌ کسٹمر کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }

    const billData = {
      customer_name: command.customer_name,
      amount: command.amount || null
    };

    onCreateBill(billData);
    onOpenBillsPopup();
    this.showMsg(`📝 "${command.customer_name}" کا نیا بل بنا رہے ہیں`, "success");
    return true;
  }

  // 🔍 SEARCH BILL (action: 2) - "ali ka bill dhundho"
  async handleSearchBill(command, onSearchBill, onOpenBillsPopup) {
    if (!command.customer_name) {
      this.showMsg("❌ کسٹمر کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }

    // First check if customer has any unpaid bills
    const hasUnpaidBills = await this.checkUnpaidBills(command.customer_name);
    
    if (!hasUnpaidBills) {
      this.showMsg(`ℹ️ "${command.customer_name}" کا کوئی غیر ادا شدہ بل نہیں ہے۔ پہلے بل بنائیں۔`, "info");
    }

    onSearchBill(command.customer_name);
    onOpenBillsPopup();
    this.showMsg(`🔍 "${command.customer_name}" کے بل تلاش کیے جا رہے ہیں`, "success");
    return true;
  }

  // 💰 PAY BILL (action: 3) - "ali ka bill ada karo"
  async handlePayBill(command, onPayBill, onOpenBillsPopup) {
    if (!command.customer_name) {
      this.showMsg("❌ کسٹمر کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }

    // Check if customer has unpaid bills before paying
    const hasUnpaidBills = await this.checkUnpaidBills(command.customer_name);
    
    if (!hasUnpaidBills) {
      this.showMsg(`❌ "${command.customer_name}" کا کوئی غیر ادا شدہ بل نہیں ہے جو ادا کیا جا سکے۔`, "error");
      return false;
    }

    onPayBill(command.customer_name);
    onOpenBillsPopup();
    this.showMsg(`💰 "${command.customer_name}" کا بل ادا کرنے کی کارروائی ہو رہی ہے`, "success");
    return true;
  }

  // 🖨️ PRINT BILL (action: 4) - "ali ka bill print karo"
  async handlePrintBill(command, onPrintBill) {
    if (!command.customer_name) {
      this.showMsg("❌ کسٹمر کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }

    // Check if customer has any bills (paid or unpaid)
    const hasAnyBill = await this.checkAnyBill(command.customer_name);
    
    if (!hasAnyBill) {
      this.showMsg(`❌ "${command.customer_name}" کا کوئی بل موجود نہیں ہے۔ پہلے بل بنائیں۔`, "error");
      return false;
    }

    onPrintBill(command.customer_name);
    this.showMsg(`🖨️ "${command.customer_name}" کا بل پرنٹ کیا جا رہا ہے`, "success");
    return true;
  }

  // 👁️ VIEW BILL DETAILS (action: 5) - "ali ka bill dekhao"
  async handleViewBill(command, onViewBill, onOpenBillsPopup) {
    if (!command.customer_name) {
      this.showMsg("❌ کسٹمر کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }

    // Check if customer has any bills
    const hasAnyBill = await this.checkAnyBill(command.customer_name);
    
    if (!hasAnyBill) {
      this.showMsg(`❌ "${command.customer_name}" کا کوئی بل موجود نہیں ہے۔ پہلے بل بنائیں۔`, "error");
      return false;
    }

    // Get bill details - prioritize unpaid bills
    const billDetails = await this.getBillDetails(command.customer_name);
    
    if (billDetails) {
      onViewBill(billDetails);
      onOpenBillsPopup();
      this.showMsg(`👁️ "${command.customer_name}" کا بل دکھایا جا رہا ہے`, "success");
    } else {
      this.showMsg(`❌ "${command.customer_name}" کا بل ڈھونڈنے میں خرابی`, "error");
    }
    return true;
  }

  // Helper: Check if customer has unpaid bills
  async checkUnpaidBills(customerName) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/bills/`, {
        params: { status: "unpaid" },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const bills = response.data || [];
      const customerBills = bills.filter(bill => 
        bill.customer_name?.toLowerCase() === customerName.toLowerCase()
      );
      
      return customerBills.length > 0;
    } catch (err) {
      console.error("Error checking unpaid bills:", err);
      return false;
    }
  }

  // Helper: Check if customer has any bill (paid or unpaid)
  async checkAnyBill(customerName) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/bills/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const bills = response.data || [];
      const customerBills = bills.filter(bill => 
        bill.customer_name?.toLowerCase() === customerName.toLowerCase()
      );
      
      return customerBills.length > 0;
    } catch (err) {
      console.error("Error checking bills:", err);
      return false;
    }
  }

  // Helper: Get bill details (prioritize unpaid bills)
  async getBillDetails(customerName) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/bills/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const bills = response.data || [];
      const customerBills = bills.filter(bill => 
        bill.customer_name?.toLowerCase() === customerName.toLowerCase()
      );
      
      // First try to find unpaid bill
      const unpaidBill = customerBills.find(bill => bill.status === "unpaid");
      if (unpaidBill) return unpaidBill;
      
      // If no unpaid bill, return the most recent bill
      if (customerBills.length > 0) {
        customerBills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return customerBills[0];
      }
      
      return null;
    } catch (err) {
      console.error("Error getting bill details:", err);
      return null;
    }
  }

  // Execute create bill
  async executeCreateBill(customerName, amount = null) {
    try {
      const token = localStorage.getItem("token");
      // This would call your API to create a new bill
      // Adjust according to your actual API endpoint
      const response = await axios.post(`${API}/bills/create`, 
        { customer_name: customerName, amount: amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      this.showMsg(`✅ "${customerName}" کا نیا بل بنا دیا گیا`, "success");
      if (this.refreshBills) await this.refreshBills();
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "بل بنانے میں خرابی";
      this.showMsg(`❌ ${errorMsg}`, "error");
      return null;
    }
  }

  // Execute pay bill
  async executePayBill(customerName) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${API}/bills/pay/${encodeURIComponent(customerName)}/`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      this.showMsg(response.data.message || `✅ "${customerName}" کا بل ادا کر دیا گیا`, "success");
      if (this.refreshBills) await this.refreshBills();
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "ادائیگی ناکام";
      this.showMsg(`❌ ${errorMsg}`, "error");
      return false;
    }
  }

  // Execute print bill (returns print data)
  async executePrintBill(customerName) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/bills/${encodeURIComponent(customerName)}/print`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "پرنٹنگ ناکام";
      this.showMsg(`❌ ${errorMsg}`, "error");
      return null;
    }
  }
}