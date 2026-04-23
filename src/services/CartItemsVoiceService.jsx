// CartItemsVoiceService.js - Dedicated service for Cart/Bill Items CRUD operations via voice commands
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export class CartItemsVoiceService {
  constructor(showMsgCallback, refreshCartCallback) {
    this.showMsg = showMsgCallback;
    this.refreshCart = refreshCartCallback;
  }

  // Main dispatcher
  async processCommand(commandJson, callbacks) {
    console.log("CartItemsVoiceService processing:", commandJson);

    // Check for invalid action (action: 0)
    if (commandJson.action === 0) {
      this.showMsg(commandJson.message || "❌ یہ کمانڈ یہاں پروسیس نہیں کی جا سکتی۔ براہ کرم صرف کارٹ/نقد آئٹمز سے متعلق کمانڈ دیں۔", "error");
      return false;
    }

    const {
      onShowAddForm,
      onShowDeleteConfirm,
      onClearCart,
      onBillAction
    } = callbacks;

    switch (commandJson.action) {
      case 1:
        return this.handleAdd(commandJson, onShowAddForm);
      case 2:
        return this.handleDelete(commandJson, onShowDeleteConfirm);
      case 3:
        return this.handleUpdate(commandJson, onShowAddForm);
      case 4:
        return this.handleClearCart(onClearCart);
      case 5:
        return this.handleBillAction(onBillAction);
      default:
        this.showMsg("❌ نامعلوم کمانڈ", "error");
        return false;
    }
  }

  // ✅ ADD ITEM TO CART (action: 1)
  async handleAdd(command, onShowAddForm) {
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
      item_name: command.item_name,
      quantity: command.quantity || 1,
      requested_unit: selectedUnit,
      custom_unit: customUnit,
      mode: "ADD"
    };

    onShowAddForm(formData);
    this.showMsg(`📝 "${command.item_name}" کارٹ میں شامل کرنے کا فارم کھل رہا ہے`, "success");
    return true;
  }

  // ❌ DELETE ITEM FROM CART (action: 2)
  async handleDelete(command, onShowDeleteConfirm) {
    if (!command.item_name) {
      this.showMsg("❌ آئٹم کا نام نہیں ملا", "error");
      return false;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/cart/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const items = Array.isArray(response.data) ? response.data : [];
      
      let foundItem = items.find(item => 
        item.item_name?.toLowerCase() === command.item_name.toLowerCase()
      );

      if (!foundItem && items.length > 0) {
        // Try partial match
        foundItem = items.find(item => 
          item.item_name?.toLowerCase().includes(command.item_name.toLowerCase())
        );
      }

      if (!foundItem) {
        this.showMsg(`❌ "${command.item_name}" کارٹ میں موجود نہیں ہے`, "error");
        return false;
      }

      onShowDeleteConfirm({
        id: foundItem.billitem_id,
        name: foundItem.item_name,
        quantity: foundItem.quantity,
        unit: foundItem.requested_unit,
        totalAmount: foundItem.total_amount
      });

      return true;
    } catch (err) {
      this.showMsg("کارٹ آئٹم ڈھونڈنے میں خرابی", "error");
      return false;
    }
  }

  // ✏️ UPDATE/EDIT ITEM IN CART (action: 3)
  async handleUpdate(command, onShowAddForm) {
    if (!command.item_name) {
      this.showMsg("❌ آئٹم کا نام نہیں ملا", "error");
      return false;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/cart/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const items = Array.isArray(response.data) ? response.data : [];
      
      let foundItem = items.find(item => 
        item.item_name?.toLowerCase() === command.item_name.toLowerCase()
      );

      if (!foundItem) {
        this.showMsg(`❌ "${command.item_name}" کارٹ میں موجود نہیں ہے`, "error");
        return false;
      }

      let newQuantity = foundItem.quantity;
      const changeType = command.update_fields?.change_type || "absolute";
      
      if (command.update_fields?.new_quantity !== null && command.update_fields?.new_quantity !== undefined) {
        if (changeType === "decrease") {
          newQuantity = foundItem.quantity - Math.abs(command.update_fields.new_quantity);
          if (newQuantity <= 0) {
            this.showMsg(`⚠️ "${command.item_name}" کی مقدار صفر ہو گئی۔ براہ کرم حذف کرنے کے لیے کہیں`, "info");
            return false;
          }
        } else if (changeType === "increase") {
          newQuantity = foundItem.quantity + Math.abs(command.update_fields.new_quantity);
        } else {
          newQuantity = command.update_fields.new_quantity;
        }
      }
      
      const formData = {
        item_name: foundItem.item_name,
        quantity: newQuantity,
        requested_unit: foundItem.requested_unit,
        mode: "EDIT",
        editId: foundItem.billitem_id
      };

      onShowAddForm(formData);
      this.showMsg(`✏️ "${foundItem.item_name}" کی مقدار تبدیل کی جا رہی ہے`, "success");
      return true;
    } catch (err) {
      this.showMsg("کارٹ آئٹم ڈھونڈنے میں خرابی", "error");
      return false;
    }
  }

  // 🗑️ CLEAR CART (action: 4)
  async handleClearCart(onClearCart) {
    onClearCart();
    return true;
  }

  // 🧾 BILL ACTION - Generate/Print (action: 5)
  async handleBillAction(onBillAction) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/cart/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const items = Array.isArray(response.data) ? response.data : [];
      
      if (items.length === 0) {
        this.showMsg("❌ کارٹ خالی ہے - پہلے کارٹ میں آئٹمز شامل کریں", "error");
        return false;
      }

      onBillAction();
      return true;
    } catch (err) {
      this.showMsg("کارٹ چیک کرنے میں خرابی", "error");
      return false;
    }
  }

  // Execute actual delete after confirmation
  async executeDelete(deleteId, itemName) {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/cart/item/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      this.showMsg(`✅ "${itemName}" کارٹ سے حذف کر دیا گیا`, "success");
      if (this.refreshCart) await this.refreshCart();
      return true;
    } catch (err) {
      this.showMsg(err.response?.data?.detail || "حذف کرنے میں خرابی", "error");
      return false;
    }
  }

  // Execute clear cart
  async executeClearCart() {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      this.showMsg(`✅ کارٹ خالی کر دیا گیا`, "success");
      if (this.refreshCart) await this.refreshCart();
      return true;
    } catch (err) {
      this.showMsg(err.response?.data?.detail || "کارٹ خالی کرنے میں خرابی", "error");
      return false;
    }
  }
}