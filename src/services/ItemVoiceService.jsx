// ItemVoiceService.js - Dedicated service for Item CRUD operations via voice commands
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export class ItemVoiceService {
  constructor(showMsgCallback, refreshItemsCallback) {
    this.showMsg = showMsgCallback;
    this.refreshItems = refreshItemsCallback;
  }

  // Main dispatcher - processes command silently
  async processCommand(commandJson, callbacks) {
    console.log("ItemVoiceService processing:", commandJson);

    const {
      onShowAddForm,
      onShowDeleteConfirm,
      onShowEditForm,
      onSearch,
      onShowAllItems,
      onOpenItemsPopup
    } = callbacks;

    switch (commandJson.action) {
      case 1:
        return this.handleAdd(commandJson, onShowAddForm, onOpenItemsPopup);
      case 2:
        return this.handleDelete(commandJson, onShowDeleteConfirm, onOpenItemsPopup);
      case 3:
        return this.handleSearch(commandJson, onSearch, onOpenItemsPopup);
      case 4:
        return this.handleUpdate(commandJson, onShowEditForm, onOpenItemsPopup);
      case 5:
        return this.handleReadAll(onShowAllItems, onOpenItemsPopup);
      default:
        this.showMsg("❌ نامعلوم کمانڈ", "error");
        return false;
    }
  }

  // ✅ ADD ITEM (action: 1)
  async handleAdd(command, onShowAddForm, onOpenItemsPopup) {
    if (!command.item_name) {
      this.showMsg("❌ آئٹم کا نام نہیں ملا", "error");
      return false;
    }

    const ALLOWED_UNITS = [
      "کلو", "گرام", "پاؤ", "چھٹانک", "سیر", "من", "بوری",
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
      item_id: null,
      item_name: command.item_name,
      item_unit: selectedUnit,
      custom_unit: customUnit,
      unit_price: command.amount || "",
      stock_quantity: command.quantity || command.stock_quantity || 0,
      mode: "ADD"
    };

    onShowAddForm(formData);
    onOpenItemsPopup();
    return true;
  }

  // ❌ DELETE ITEM (action: 2)
  async handleDelete(command, onShowDeleteConfirm, onOpenItemsPopup) {
    if (!command.item_name) {
      this.showMsg("❌ آئٹم کا نام نہیں ملا", "error");
      return false;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const items = Array.isArray(response.data) ? response.data : response.data?.items || [];
      const foundItem = items.find(item => 
        item.item_name.toLowerCase() === command.item_name.toLowerCase()
      );

      if (!foundItem) {
        this.showMsg(`❌ "${command.item_name}" موجود نہیں ہے`, "error");
        return false;
      }

      onShowDeleteConfirm({
        id: foundItem.item_id,
        name: foundItem.item_name,
        unit: foundItem.item_unit,
        quantity: foundItem.stock_quantity,
        deleteQuantity: command.quantity || null
      });

      onOpenItemsPopup();
      return true;
    } catch (err) {
      this.showMsg("آئٹم ڈھونڈنے میں خرابی", "error");
      return false;
    }
  }

  // 🔍 SEARCH ITEM (action: 3)
  async handleSearch(command, onSearch, onOpenItemsPopup) {
    if (!command.item_name) {
      this.showMsg("❌ تلاش کرنے کے لیے آئٹم کا نام دیں", "error");
      return false;
    }

    onSearch(command.item_name);
    onOpenItemsPopup();
    return true;
  }

  // ✏️ UPDATE ITEM (action: 4) - FIXED VERSION
  async handleUpdate(command, onShowEditForm, onOpenItemsPopup) {
    if (!command.item_name) {
      this.showMsg("❌ آئٹم کا نام نہیں ملا", "error");
      return false;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const items = Array.isArray(response.data) ? response.data : response.data?.items || [];
      const foundItem = items.find(item => 
        item.item_name.toLowerCase() === command.item_name.toLowerCase()
      );

      if (!foundItem) {
        this.showMsg(`❌ "${command.item_name}" موجود نہیں ہے`, "error");
        return false;
      }

      const ALLOWED_UNITS = [
        "کلو", "گرام", "پاؤ", "چھٹانک", "سیر", "من", "بوری",
        "لیٹر", "ملی لیٹر", "عدد", "درجن", "آدھا درجن",
        "پیکٹ", "ڈبہ", "بوتل", "کلوگرام"
      ];

      let selectedUnit = foundItem.item_unit;
      let customUnit = "";

      if (!ALLOWED_UNITS.includes(foundItem.item_unit)) {
        selectedUnit = "__custom";
        customUnit = foundItem.item_unit;
      }

      const updateFields = command.update_fields || {};
      
      // Calculate new quantity properly
      let newQuantity = foundItem.stock_quantity;
      if (updateFields.new_quantity !== null && updateFields.new_quantity !== undefined) {
        // If it's a relative change (negative for decrease, positive for increase)
        if (updateFields.new_quantity < 0) {
          newQuantity = foundItem.stock_quantity + updateFields.new_quantity;
        } else {
          // Absolute value
          newQuantity = updateFields.new_quantity;
        }
      }
      
      const editData = {
        item_id: foundItem.item_id,
        item_name: command.item_name,
        item_unit: updateFields.new_unit || selectedUnit,
        custom_unit: (updateFields.new_unit && !ALLOWED_UNITS.includes(updateFields.new_unit)) ? updateFields.new_unit : customUnit,
        unit_price: updateFields.new_price || command.amount || foundItem.unit_price,
        stock_quantity: newQuantity,
        mode: "EDIT"
      };

      onShowEditForm(editData);
      onOpenItemsPopup();
      return true;
    } catch (err) {
      this.showMsg("آئٹم ڈھونڈنے میں خرابی", "error");
      return false;
    }
  }

  // 📋 READ ALL ITEMS (action: 5)
  async handleReadAll(onShowAllItems, onOpenItemsPopup) {
    onShowAllItems();
    onOpenItemsPopup();
    return true;
  }

  // Execute actual delete after confirmation
  async executeDelete(deleteId, itemName) {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/items/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      this.showMsg(`✅ "${itemName}" کامیابی سے حذف کر دیا گیا`, "success");
      if (this.refreshItems) await this.refreshItems();
      return true;
    } catch (err) {
      this.showMsg(err.response?.data?.detail || "حذف کرنے میں خرابی", "error");
      return false;
    }
  }

  // Execute partial delete (remove specific quantity)
  async executePartialDelete(itemId, itemName, currentQuantity, removeQuantity, unit) {
    try {
      const newQuantity = currentQuantity - removeQuantity;
      if (newQuantity < 0) {
        this.showMsg(`❌ صرف ${currentQuantity} ${unit} باقی ہے`, "error");
        return false;
      }
      
      const token = localStorage.getItem("token");
      await axios.patch(`${API}/items/${itemId}`, {
        stock_quantity: newQuantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      this.showMsg(`✅ ${removeQuantity} ${unit} "${itemName}" میں سے نکال دیا گیا`, "success");
      if (this.refreshItems) await this.refreshItems();
      return true;
    } catch (err) {
      this.showMsg(err.response?.data?.detail || "حذف کرنے میں خرابی", "error");
      return false;
    }
  }
}