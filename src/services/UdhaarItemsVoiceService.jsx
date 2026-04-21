// UdhaarItemsVoiceService.js - Dedicated service for Udhaar Items CRUD operations via voice commands
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export class UdhaarItemsVoiceService {
  constructor(showMsgCallback, refreshUdhaarCallback) {
    this.showMsg = showMsgCallback;
    this.refreshUdhaar = refreshUdhaarCallback;
  }

  // Main dispatcher
  async processCommand(commandJson, callbacks) {
    console.log("UdhaarItemsVoiceService processing:", commandJson);

    // Check for invalid action (action: 0)
    if (commandJson.action === 0) {
      this.showMsg(commandJson.message || "❌ یہ کمانڈ یہاں پروسیس نہیں کی جا سکتی۔ براہ کرم صرف ادھار آئٹمز سے متعلق کمانڈ دیں۔", "error");
      return false;
    }

    const {
      onShowAddForm,
      onShowDeleteConfirm,
      onShowEditForm,
      onSearch,
      onOpenUdhaarPopup
    } = callbacks;

    switch (commandJson.action) {
      case 1:
        return this.handleAdd(commandJson, onShowAddForm, onOpenUdhaarPopup);
      case 2:
        return this.handleDelete(commandJson, onShowDeleteConfirm, onOpenUdhaarPopup);
      case 3:
        return this.handleSearch(commandJson, onSearch, onOpenUdhaarPopup);
      case 4:
        return this.handleUpdate(commandJson, onShowEditForm, onOpenUdhaarPopup);
      default:
        this.showMsg("❌ نامعلوم کمانڈ", "error");
        return false;
    }
  }

  // ✅ ADD UDHAAR ITEM (action: 1)
  async handleAdd(command, onShowAddForm, onOpenUdhaarPopup) {
    if (!command.customer_name) {
      this.showMsg("❌ کسٹمر کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }
    
    if (!command.item_name) {
      this.showMsg("❌ آئٹم کا نام نہیں ملا۔ براہ کرم واضح بولیں", "error");
      return false;
    }

    const ALLOWED_UNITS = [
      "کلو", "گرام", "پاؤ", "آدھا پاؤ", "چھٹانک", "سیر", "من", "بوری", "بوریاں",
      "لیٹر", "ملی لیٹر", "عدد", "درجن", "آدھا درجن",
      "پیکٹ", "ڈبہ", "بوتل", "کلوگرام"
    ];

    let finalUnit = command.unit || "عدد";
    let customUnit = "";
    let selectedUnit = finalUnit;

    if (finalUnit && !ALLOWED_UNITS.includes(finalUnit)) {
      selectedUnit = "__custom";
      customUnit = finalUnit;
    }

    const formData = {
      udharitem_id: null,
      customer_name: command.customer_name,
      item_name: command.item_name,
      quantity: command.quantity || 0,
      unit: selectedUnit,
      custom_unit: customUnit,
      mode: "ADD"
    };

    onShowAddForm(formData);
    onOpenUdhaarPopup();
    this.showMsg(`📝 "${command.customer_name}" کے لیے "${command.item_name}" شامل کرنے کا فارم کھل رہا ہے`, "success");
    return true;
  }

  // ❌ DELETE UDHAAR ITEM (action: 2)
  async handleDelete(command, onShowDeleteConfirm, onOpenUdhaarPopup) {
    if (!command.customer_name && !command.item_name) {
      this.showMsg("❌ کسٹمر یا آئٹم کا نام نہیں ملا", "error");
      return false;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/udhar-items/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const items = Array.isArray(response.data) ? response.data : [];
      
      let foundItem = null;
      
      if (command.customer_name && command.item_name) {
        foundItem = items.find(item => 
          item.customer_name?.toLowerCase() === command.customer_name.toLowerCase() &&
          item.item_name?.toLowerCase() === command.item_name.toLowerCase()
        );
      } else if (command.customer_name) {
        const customerItems = items.filter(item => 
          item.customer_name?.toLowerCase() === command.customer_name.toLowerCase()
        );
        if (customerItems.length === 0) {
          this.showMsg(`❌ "${command.customer_name}" کا کوئی ادھار نہیں ہے`, "error");
          return false;
        }
        if (customerItems.length === 1) {
          foundItem = customerItems[0];
        } else {
          this.showMsg(`🔍 "${command.customer_name}" کے ${customerItems.length} ادھار ہیں۔ براہ کرم مخصوص آئٹم کا نام بھی دیں`, "info");
          onSearch(command.customer_name);
          onOpenUdhaarPopup();
          return false;
        }
      } else if (command.item_name) {
        const itemEntries = items.filter(item => 
          item.item_name?.toLowerCase() === command.item_name.toLowerCase()
        );
        if (itemEntries.length === 0) {
          this.showMsg(`❌ "${command.item_name}" کا کوئی ادھار نہیں ہے`, "error");
          return false;
        }
        if (itemEntries.length === 1) {
          foundItem = itemEntries[0];
        } else {
          this.showMsg(`🔍 "${command.item_name}" کے ${itemEntries.length} ادھار ہیں۔ براہ کرم کسٹمر کا نام بھی دیں`, "info");
          onSearch(command.item_name);
          onOpenUdhaarPopup();
          return false;
        }
      }

      if (!foundItem) {
        this.showMsg(`❌ مطلوبہ ادھار آئٹم موجود نہیں ہے`, "error");
        return false;
      }

      onShowDeleteConfirm({
        id: foundItem.udharitem_id,
        name: foundItem.item_name,
        customer: foundItem.customer_name,
        quantity: foundItem.quantity,
        unit: foundItem.requested_unit || foundItem.unit,
        totalAmount: foundItem.total_amount
      });

      onOpenUdhaarPopup();
      return true;
    } catch (err) {
      this.showMsg("ادھار آئٹم ڈھونڈنے میں خرابی", "error");
      return false;
    }
  }

  // 🔍 SEARCH UDHAAR (action: 3)
  async handleSearch(command, onSearch, onOpenUdhaarPopup) {
    const searchTerm = command.search_term || command.customer_name || command.item_name;
    
    if (!searchTerm) {
      this.showMsg("❌ تلاش کرنے کے لیے کسٹمر یا آئٹم کا نام دیں", "error");
      return false;
    }

    onSearch(searchTerm);
    onOpenUdhaarPopup();
    this.showMsg(`🔍 "${searchTerm}" تلاش کیا جا رہا ہے`, "success");
    return true;
  }

  // ✏️ UPDATE UDHAAR ITEM (action: 4)
  async handleUpdate(command, onShowEditForm, onOpenUdhaarPopup) {
    if (!command.customer_name && !command.item_name) {
      this.showMsg("❌ کسٹمر یا آئٹم کا نام نہیں ملا", "error");
      return false;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/udhar-items/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const items = Array.isArray(response.data) ? response.data : [];
      
      let foundItem = null;
      
      if (command.customer_name && command.item_name) {
        foundItem = items.find(item => 
          item.customer_name?.toLowerCase() === command.customer_name.toLowerCase() &&
          item.item_name?.toLowerCase() === command.item_name.toLowerCase()
        );
      } else if (command.customer_name) {
        const customerItems = items.filter(item => 
          item.customer_name?.toLowerCase() === command.customer_name.toLowerCase()
        );
        if (customerItems.length === 1) {
          foundItem = customerItems[0];
        } else if (customerItems.length > 1) {
          this.showMsg(`🔍 "${command.customer_name}" کے ${customerItems.length} ادھار ہیں۔ براہ کرم مخصوص آئٹم کا نام بھی دیں`, "info");
          onSearch(command.customer_name);
          onOpenUdhaarPopup();
          return false;
        } else {
          this.showMsg(`❌ "${command.customer_name}" کا کوئی ادھار نہیں ہے`, "error");
          return false;
        }
      } else if (command.item_name) {
        const itemEntries = items.filter(item => 
          item.item_name?.toLowerCase() === command.item_name.toLowerCase()
        );
        if (itemEntries.length === 1) {
          foundItem = itemEntries[0];
        } else if (itemEntries.length > 1) {
          this.showMsg(`🔍 "${command.item_name}" کے ${itemEntries.length} ادھار ہیں۔ براہ کرم کسٹمر کا نام بھی دیں`, "info");
          onSearch(command.item_name);
          onOpenUdhaarPopup();
          return false;
        } else {
          this.showMsg(`❌ "${command.item_name}" کا کوئی ادھار نہیں ہے`, "error");
          return false;
        }
      }

      if (!foundItem) {
        this.showMsg(`❌ مطلوبہ ادھار آئٹم موجود نہیں ہے`, "error");
        return false;
      }

      const ALLOWED_UNITS = [
        "کلو", "گرام", "پاؤ", "آدھا پاؤ", "چھٹانک", "سیر", "من", "بوری", "بوریاں",
        "لیٹر", "ملی لیٹر", "عدد", "درجن", "آدھا درجن",
        "پیکٹ", "ڈبہ", "بوتل", "کلوگرام"
      ];

      const updateFields = command.update_fields || {};
      
      let newQuantity = foundItem.quantity;
      const changeType = updateFields.change_type || "absolute";
      
      if (updateFields.new_quantity !== null && updateFields.new_quantity !== undefined) {
        if (changeType === "decrease") {
          newQuantity = foundItem.quantity - Math.abs(updateFields.new_quantity);
          if (newQuantity < 0) {
            this.showMsg(`❌ صرف ${foundItem.quantity} ${foundItem.requested_unit || foundItem.unit} باقی ہے`, "error");
            return false;
          }
        } else if (changeType === "increase") {
          newQuantity = foundItem.quantity + Math.abs(updateFields.new_quantity);
        } else {
          newQuantity = updateFields.new_quantity;
        }
      }
      
      const requestedUnit = updateFields.new_unit || foundItem.requested_unit || foundItem.unit;
      let selectedUnit = requestedUnit;
      let customUnit = "";

      if (requestedUnit && !ALLOWED_UNITS.includes(requestedUnit)) {
        selectedUnit = "__custom";
        customUnit = requestedUnit;
      }

      const editData = {
        udharitem_id: foundItem.udharitem_id,
        customer_name: foundItem.customer_name,
        item_name: foundItem.item_name,
        quantity: newQuantity,
        unit: selectedUnit,
        custom_unit: customUnit,
        mode: "EDIT"
      };

      onShowEditForm(editData);
      onOpenUdhaarPopup();
      this.showMsg(`✏️ "${foundItem.customer_name}" کے "${foundItem.item_name}" کی ترمیم کا فارم کھل رہا ہے`, "success");
      return true;
    } catch (err) {
      this.showMsg("ادھار آئٹم ڈھونڈنے میں خرابی", "error");
      return false;
    }
  }

  // Execute actual delete after confirmation
  async executeDelete(deleteId, itemName, customerName) {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/udhar-items/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      this.showMsg(`✅ "${customerName}" کا "${itemName}" کامیابی سے حذف کر دیا گیا`, "success");
      if (this.refreshUdhaar) await this.refreshUdhaar();
      return true;
    } catch (err) {
      this.showMsg(err.response?.data?.detail || "حذف کرنے میں خرابی", "error");
      return false;
    }
  }
}