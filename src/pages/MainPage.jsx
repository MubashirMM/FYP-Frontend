// // import { useState, useRef, useEffect } from "react";
// // import { useNavigate } from "react-router-dom";
// // import axios from "axios";

// // function MainPage() {
// //   const [isRecording, setIsRecording] = useState(false);
// //   const [audioSample, setAudioSample] = useState(null);
// //   const [audioUrl, setAudioUrl] = useState(null);
// //   const [editableText, setEditableText] = useState("");
// //   const [command, setCommand] = useState(null);
// //   const [isProcessing, setIsProcessing] = useState(false);
// //   const [message, setMessage] = useState("");
// //   const [error, setError] = useState("");
// //   const [successMessage, setSuccessMessage] = useState("");
  
// //   const mediaRecorderRef = useRef(null);
// //   const chunksRef = useRef([]);
// //   const streamRef = useRef(null);
// //   const audioRef = useRef(null);
// //   const navigate = useNavigate();
  
// //   const API = import.meta.env.VITE_API_URL;

// //   // Check if user is logged in
// //   useEffect(() => {
// //     const token = localStorage.getItem("token");
// //     if (!token) {
// //       navigate("/login");
// //     }
// //   }, [navigate]);

// //   // Cleanup on unmount
// //   useEffect(() => {
// //     return () => {
// //       if (streamRef.current) {
// //         streamRef.current.getTracks().forEach(track => track.stop());
// //       }
// //       if (audioUrl) {
// //         URL.revokeObjectURL(audioUrl);
// //       }
// //     };
// //   }, [audioUrl]);

// //   // Toggle recording
// //   async function toggleRecording() {
// //     if (isRecording) {
// //       stopRecording();
// //     } else {
// //       await startRecording();
// //     }
// //   }

// //   async function startRecording() {
// //     try {
// //       setError("");
// //       setMessage("");
// //       setSuccessMessage("");
      
// //       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
// //       streamRef.current = stream;

// //       mediaRecorderRef.current = new MediaRecorder(stream);
// //       chunksRef.current = [];

// //       mediaRecorderRef.current.ondataavailable = (e) => {
// //         if (e.data.size > 0) chunksRef.current.push(e.data);
// //       };

// //       mediaRecorderRef.current.onstop = async () => {
// //         try {
// //           const blob = new Blob(chunksRef.current, { type: "audio/webm" });
// //           const wavBlob = await convertToWav(blob);
          
// //           const url = URL.createObjectURL(wavBlob);
// //           setAudioUrl(url);
// //           setAudioSample(wavBlob);
          
// //           setMessage("✅ ریکارڈ محفوظ ہو گیا");
// //           setIsRecording(false);
          
// //           if (streamRef.current) {
// //             streamRef.current.getTracks().forEach(track => track.stop());
// //           }
          
// //         } catch (err) {
// //           console.error(err);
// //           setError("ریکارڈ محفوظ کرنے میں خرابی");
// //           setIsRecording(false);
// //         }
// //       };

// //       mediaRecorderRef.current.start();
// //       setIsRecording(true);
// //       setMessage("🔴 ریکارڈنگ جاری ہے...");

// //     } catch {
// //       setError("مائیکروفون تک رسائی نہیں ملی");
// //     }
// //   }

// //   function stopRecording() {
// //     if (mediaRecorderRef.current && isRecording) {
// //       mediaRecorderRef.current.stop();
// //       setMessage("⏹️ ریکارڈنگ بند کر دی گئی");
// //     }
// //   }

// //   // File upload handler
// //   async function handleFileUpload(e) {
// //     try {
// //       const file = e.target.files[0];
// //       if (!file) return;
      
// //       setError("");
// //       setMessage("");
// //       setSuccessMessage("");
// //       setEditableText("");
// //       setCommand(null);
      
// //       setMessage("📁 فائل اپ لوڈ ہو رہی ہے...");
      
// //       const wavBlob = await convertToWav(file);
// //       const url = URL.createObjectURL(wavBlob);
// //       setAudioUrl(url);
// //       setAudioSample(wavBlob);
      
// //       setMessage("✅ فائل اپ لوڈ ہو گئی");
      
// //     } catch (err) {
// //       console.error(err);
// //       setError("فائل اپ لوڈ میں خرابی");
// //     }
// //   }

// //   // Send voice to get text and show in textarea
// //   async function convertVoiceToText() {
// //     if (!audioSample) {
// //       setError("براہ کرم پہلے آواز ریکارڈ کریں یا فائل اپ لوڈ کریں");
// //       return;
// //     }
    
// //     setIsProcessing(true);
// //     setError("");
// //     setMessage("");
// //     setSuccessMessage("");
// //     setEditableText("");
// //     setCommand(null);
    
// //     try {
// //       const formData = new FormData();
// //       formData.append("audio", audioSample, "audio.wav");
      
// //       setMessage("🎤 آواز کو متن میں تبدیل کیا جا رہا ہے...");
      
// //       const response = await axios.post(`${API}/voice-process`, formData, {
// //         headers: { "Content-Type": "multipart/form-data" }
// //       });
      
// //       if (response.data && response.data.text) {
// //         const detected = response.data.text;
// //         setEditableText(detected);
// //         setMessage(`✅ متن مل گیا`);
// //         setSuccessMessage("آواز کامیابی سے متن میں تبدیل ہو گئی");
// //       } else {
// //         setError("❌ آواز میں کوئی واضح بات نہیں ہے");
// //       }
      
// //     } catch (err) {
// //       console.error(err);
// //       setError(err.response?.data?.detail || "آواز پروسیس کرنے میں خرابی");
// //     } finally {
// //       setIsProcessing(false);
// //     }
// //   }

// //   // Send text to get JSON command
// //   async function convertTextToCommand() {
// //     if (!editableText.trim()) {
// //       setError("براہ کرم متن درج کریں");
// //       return;
// //     }
    
// //     setIsProcessing(true);
// //     setError("");
// //     setSuccessMessage("");
// //     setCommand(null);
    
// //     try {
// //       setMessage("🤖 متن سے کمانڈ بنا رہے ہیں...");
      
// //       const response = await axios.post(`${API}/text-process`, {
// //         text: editableText
// //       });
      
// //       if (response.data) {
// //         let commandJson;
// //         try {
// //           commandJson = typeof response.data.command === 'string' 
// //             ? JSON.parse(response.data.command) 
// //             : response.data.command;
// //           setCommand(commandJson);
// //           setSuccessMessage("✅ کمانڈ مل گئی");
// //           setMessage("");
          
// //         } catch (e) {
// //           setCommand({ raw: response.data.command });
// //           setSuccessMessage("✅ کمانڈ مل گئی");
// //         }
// //       }
      
// //     } catch (err) {
// //       console.error(err);
// //       setError(err.response?.data?.detail || "کمانڈ بنانے میں خرابی");
// //     } finally {
// //       setIsProcessing(false);
// //     }
// //   }

// //   // Clear everything
// //   const clearAll = () => {
// //     setAudioSample(null);
// //     setAudioUrl(null);
// //     setEditableText("");
// //     setCommand(null);
// //     setMessage("");
// //     setError("");
// //     setSuccessMessage("");
// //     if (audioRef.current) {
// //       audioRef.current.src = "";
// //     }
// //   };

// //   // Convert to WAV
// //   async function convertToWav(input) {
// //     const audioContext = new AudioContext();
// //     const arrayBuffer = await input.arrayBuffer();
// //     const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
// //     const wavBuffer = encodeWAV(audioBuffer);
// //     return new Blob([wavBuffer], { type: "audio/wav" });
// //   }

// //   function encodeWAV(audioBuffer) {
// //     const samples = audioBuffer.getChannelData(0);
// //     const sampleRate = audioBuffer.sampleRate;

// //     const buffer = new ArrayBuffer(44 + samples.length * 2);
// //     const view = new DataView(buffer);

// //     const writeString = (view, offset, str) => {
// //       for (let i = 0; i < str.length; i++) {
// //         view.setUint8(offset + i, str.charCodeAt(i));
// //       }
// //     };

// //     writeString(view, 0, "RIFF");
// //     view.setUint32(4, 36 + samples.length * 2, true);
// //     writeString(view, 8, "WAVE");
// //     writeString(view, 12, "fmt ");
// //     view.setUint32(16, 16, true);
// //     view.setUint16(20, 1, true);
// //     view.setUint16(22, 1, true);
// //     view.setUint32(24, sampleRate, true);
// //     view.setUint32(28, sampleRate * 2, true);
// //     view.setUint16(32, 2, true);
// //     view.setUint16(34, 16, true);
// //     writeString(view, 36, "data");
// //     view.setUint32(40, samples.length * 2, true);

// //     let offset = 44;
// //     for (let i = 0; i < samples.length; i++, offset += 2) {
// //       let s = Math.max(-1, Math.min(1, samples[i]));
// //       view.setInt16(offset, s * 0x7fff, true);
// //     }

// //     return buffer;
// //   }

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
// //       <div className="max-w-4xl mx-auto">
// //         {/* Header */}
// //         <div className="bg-white rounded-xl shadow-md p-3 mb-4 text-center">
// //           <h1 className="text-xl font-bold text-gray-800 font-urdu">
// //             🎤 وائس کمانڈ
// //           </h1>
// //         </div>

// //         {/* Voice Recording Section - Small Height */}
// //         <div className="bg-white rounded-xl shadow-md p-4 mb-4">
// //           <div className="flex flex-col items-center">
// //             {/* Recording Button - Smaller */}
// //             <button
// //               onClick={toggleRecording}
// //               disabled={isProcessing}
// //               className={`relative w-24 h-24 rounded-full transition-all duration-300 ${
// //                 isRecording
// //                   ? "bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-300 animate-pulse"
// //                   : audioSample
// //                   ? "bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-300"
// //                   : "bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-300 hover:scale-105"
// //               } disabled:opacity-50`}
// //             >
// //               <div className="absolute inset-0 flex items-center justify-center">
// //                 {isRecording ? (
// //                   <div className="flex gap-1">
// //                     <div className="w-1.5 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
// //                     <div className="w-1.5 h-7 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
// //                     <div className="w-1.5 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
// //                   </div>
// //                 ) : audioSample ? (
// //                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
// //                   </svg>
// //                 ) : (
// //                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
// //                   </svg>
// //                 )}
// //               </div>
// //             </button>
            
// //             <p className="mt-2 text-xs font-urdu text-gray-600">
// //               {isRecording 
// //                 ? "🔴 ریکارڈنگ جاری ہے..." 
// //                 : audioSample 
// //                 ? "✅ آواز ریکارڈ ہو چکی ہے" 
// //                 : "ریکارڈ کرنے کے لیے دبائیں"}
// //             </p>

// //             {/* Audio Player - Compact */}
// //             {audioSample && (
// //               <div className="w-full mt-3">
// //                 <audio ref={audioRef} controls src={audioUrl} className="w-full h-8 rounded-lg" />
// //               </div>
// //             )}

// //             {/* File Upload Option */}
// //             <div className="w-full mt-3">
// //               <input
// //                 type="file"
// //                 accept="audio/*"
// //                 onChange={handleFileUpload}
// //                 className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
// //               />
// //             </div>

// //             {/* Clear Button */}
// //             {audioSample && (
// //               <button
// //                 onClick={clearAll}
// //                 className="mt-2 px-3 py-1 bg-gray-500 text-white rounded-lg text-xs hover:bg-gray-600 transition-colors"
// //               >
// //                 صاف کریں
// //               </button>
// //             )}
// //           </div>
// //         </div>

// //         {/* Convert Button */}
// //         {audioSample && (
// //           <button
// //             onClick={convertVoiceToText}
// //             disabled={isProcessing}
// //             className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 rounded-xl font-urdu text-base font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 mb-4 flex items-center justify-center gap-2 shadow-md"
// //           >
// //             {isProcessing ? (
// //               <>
// //                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
// //                 <span>تبدیل ہو رہا ہے...</span>
// //               </>
// //             ) : (
// //               "🎤 آواز کو متن میں تبدیل کریں"
// //             )}
// //           </button>
// //         )}

// //         {/* Text Area Section */}
// //         <div className="bg-white rounded-xl shadow-md p-4 mb-4">
// //           <textarea
// //             value={editableText}
// //             onChange={(e) => setEditableText(e.target.value)}
// //             placeholder="آواز سے تبدیل شدہ متن یہاں ظاہر ہوگا..."
// //             className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 text-sm min-h-[100px]"
// //             dir="rtl"
// //           />
          
// //           {editableText && (
// //             <button
// //               onClick={convertTextToCommand}
// //               disabled={isProcessing}
// //               className="w-full mt-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg font-urdu text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
// //             >
// //               {isProcessing ? (
// //                 <>
// //                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
// //                   <span>کمانڈ بنا رہا ہے...</span>
// //                 </>
// //               ) : (
// //                 "🤖 متن کو کمانڈ میں تبدیل کریں"
// //               )}
// //             </button>
// //           )}
// //         </div>

// //         {/* JSON Response Section */}
// //         {command && (
// //           <div className="bg-white rounded-xl shadow-md p-3 mb-4">
// //             <h3 className="text-sm font-bold text-gray-800 mb-2 font-urdu text-right">
// //               📋 کمانڈ کا جواب:
// //             </h3>
// //             <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-2 border border-purple-200">
// //               <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
// //                 {JSON.stringify(command, null, 2)}
// //               </pre>
// //             </div>
// //           </div>
// //         )}

// //         {/* Messages */}
// //         {(message || error || successMessage) && (
// //           <div className="bg-white rounded-xl shadow-md p-2">
// //             {message && (
// //               <div className="p-1.5 bg-blue-100 border border-blue-400 text-blue-700 rounded text-right text-xs mb-1">
// //                 {message}
// //               </div>
// //             )}
// //             {error && (
// //               <div className="p-1.5 bg-red-100 border border-red-400 text-red-700 rounded text-right text-xs mb-1">
// //                 ❌ {error}
// //               </div>
// //             )}
// //             {successMessage && (
// //               <div className="p-1.5 bg-green-100 border border-green-400 text-green-700 rounded text-right text-xs">
// //                 ✅ {successMessage}
// //               </div>
// //             )}
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// import { useState, useRef, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import Items from "./Items";

// function MainPage() {
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioSample, setAudioSample] = useState(null);
//   const [audioUrl, setAudioUrl] = useState(null);
//   const [editableText, setEditableText] = useState("");
//   const [command, setCommand] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");
  
//   // Items popup states
//   const [showItemsPopup, setShowItemsPopup] = useState(false);
//   const [autoFillData, setAutoFillData] = useState(null);
//   const [pendingCommand, setPendingCommand] = useState(null);
//   const [externalSearch, setExternalSearch] = useState(null);
  
//   const mediaRecorderRef = useRef(null);
//   const chunksRef = useRef([]);
//   const streamRef = useRef(null);
//   const audioRef = useRef(null);
//   const navigate = useNavigate();
  
//   const API = import.meta.env.VITE_API_URL;

//   // Check if user is logged in
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       navigate("/login");
//     }
//   }, [navigate]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(track => track.stop());
//       }
//       if (audioUrl) {
//         URL.revokeObjectURL(audioUrl);
//       }
//     };
//   }, [audioUrl]);

//   // Auto-execute command when received
//   useEffect(() => {
//     if (command && command.action) {
//       executeVoiceCommand(command);
//     }
//   }, [command]);

//   // Execute command based on action type
//   const executeVoiceCommand = async (cmd) => {
//     console.log("Processing command:", cmd);
    
//     // For ADD (action 1)
//     if (cmd.action === 1) {
//       const ALLOWED_UNITS = [
//         "کلو", "گرام", "پاؤ", "چھٹانک", "سیر", "من", "بوری",
//         "لیٹر", "ملی لیٹر", "عدد", "درجن", "آدھا درجن",
//         "پیکٹ", "ڈبہ", "بوتل", "کلوگرام"
//       ];
      
//       let finalUnit = cmd.unit || "عدد";
//       let customUnit = "";
//       let selectedUnit = finalUnit;
      
//       if (finalUnit && !ALLOWED_UNITS.includes(finalUnit)) {
//         selectedUnit = "__custom";
//         customUnit = finalUnit;
//       }
      
//       const formData = {
//         item_id: null,
//         item_name: cmd.item_name || "",
//         item_unit: selectedUnit,
//         custom_unit: customUnit,
//         unit_price: cmd.amount || cmd.unit_price || "",
//         stock_quantity: cmd.quantity || cmd.stock_quantity || 0,
//         mode: "ADD"
//       };
      
//       setAutoFillData(formData);
//       setPendingCommand(null);
//       setShowItemsPopup(true);
//       setSuccessMessage("📝 نیا آئٹم فارم خودکار بھر دیا گیا ہے");
//       setTimeout(() => setSuccessMessage(""), 3000);
//     }
    
//     // For DELETE (action 2)
//     else if (cmd.action === 2) {
//       setPendingCommand(cmd);
//       setAutoFillData(null);
//       setShowItemsPopup(true);
//       setSuccessMessage(`🗑️ "${cmd.item_name}" کو حذف کرنے کے لیے تیار ہے`);
//       setTimeout(() => setSuccessMessage(""), 3000);
//     }
    
//     // For UPDATE (action 4 - note: using action 4 for update as per your system prompt)
//     else if (cmd.action === 4) {
//       // First fetch the item to get current data
//       try {
//         const token = localStorage.getItem("token");
//         const response = await axios.get(`${API}/items`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
        
//         const items = Array.isArray(response.data) ? response.data : response.data?.items || [];
//         const foundItem = items.find(item => 
//           item.item_name.toLowerCase() === (cmd.item_name || "").toLowerCase()
//         );
        
//         if (foundItem) {
//           const ALLOWED_UNITS = [
//             "کلو", "گرام", "پاؤ", "چھٹانک", "سیر", "من", "بوری",
//             "لیٹر", "ملی لیٹر", "عدد", "درجن", "آدھا درجن",
//             "پیکٹ", "ڈبہ", "بوتل", "کلوگرام"
//           ];
          
//           let selectedUnit = foundItem.item_unit;
//           let customUnit = "";
          
//           if (!ALLOWED_UNITS.includes(foundItem.item_unit)) {
//             selectedUnit = "__custom";
//             customUnit = foundItem.item_unit;
//           }
          
//           const updateFields = cmd.update_fields || {};
          
//           const editData = {
//             item_id: foundItem.item_id,
//             item_name: cmd.item_name,
//             item_unit: updateFields.new_unit || selectedUnit,
//             custom_unit: (updateFields.new_unit && !ALLOWED_UNITS.includes(updateFields.new_unit)) ? updateFields.new_unit : customUnit,
//             unit_price: updateFields.new_price || cmd.amount || foundItem.unit_price,
//             stock_quantity: updateFields.new_quantity || cmd.quantity || foundItem.stock_quantity,
//             mode: "EDIT"
//           };
          
//           setAutoFillData(editData);
//           setPendingCommand(null);
//           setShowItemsPopup(true);
//           setSuccessMessage(`✏️ "${cmd.item_name}" کی ترمیم کا فارم کھل رہا ہے`);
//           setTimeout(() => setSuccessMessage(""), 3000);
//         } else {
//           setError(`❌ "${cmd.item_name}" موجود نہیں ہے`);
//           setTimeout(() => setError(""), 3000);
//           setShowItemsPopup(true);
//         }
//       } catch (err) {
//         setError("آئٹم ڈھونڈنے میں خرابی");
//         setTimeout(() => setError(""), 3000);
//       }
//     }
    
//     // For SEARCH (action 3)
//     else if (cmd.action === 3) {
//       setExternalSearch(cmd.item_name);
//       setPendingCommand(null);
//       setAutoFillData(null);
//       setShowItemsPopup(true);
//       setSuccessMessage(`🔍 "${cmd.item_name}" تلاش کیا جا رہا ہے`);
//       setTimeout(() => setSuccessMessage(""), 3000);
//     }
    
//     // For READ ALL (action 5)
//     else if (cmd.action === 5) {
//       setExternalSearch(null);
//       setPendingCommand(null);
//       setAutoFillData(null);
//       setShowItemsPopup(true);
//       setSuccessMessage(`📋 تمام آئٹمز کی فہرست کھل رہی ہے`);
//       setTimeout(() => setSuccessMessage(""), 3000);
//     }
    
//     else {
//       setError(`❌ نامعلوم ایکشن: ${cmd.action}`);
//       setTimeout(() => setError(""), 3000);
//     }
//   };

//   // Toggle recording
//   async function toggleRecording() {
//     if (isRecording) {
//       stopRecording();
//     } else {
//       await startRecording();
//     }
//   }

//   async function startRecording() {
//     try {
//       setError("");
//       setMessage("");
//       setSuccessMessage("");
      
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       streamRef.current = stream;

//       mediaRecorderRef.current = new MediaRecorder(stream);
//       chunksRef.current = [];

//       mediaRecorderRef.current.ondataavailable = (e) => {
//         if (e.data.size > 0) chunksRef.current.push(e.data);
//       };

//       mediaRecorderRef.current.onstop = async () => {
//         try {
//           const blob = new Blob(chunksRef.current, { type: "audio/webm" });
//           const wavBlob = await convertToWav(blob);
          
//           const url = URL.createObjectURL(wavBlob);
//           setAudioUrl(url);
//           setAudioSample(wavBlob);
          
//           setMessage("✅ ریکارڈ محفوظ ہو گیا");
//           setIsRecording(false);
          
//           if (streamRef.current) {
//             streamRef.current.getTracks().forEach(track => track.stop());
//           }
          
//         } catch (err) {
//           console.error(err);
//           setError("ریکارڈ محفوظ کرنے میں خرابی");
//           setIsRecording(false);
//         }
//       };

//       mediaRecorderRef.current.start();
//       setIsRecording(true);
//       setMessage("🔴 ریکارڈنگ جاری ہے...");

//     } catch {
//       setError("مائیکروفون تک رسائی نہیں ملی");
//     }
//   }

//   function stopRecording() {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       setMessage("⏹️ ریکارڈنگ بند کر دی گئی");
//     }
//   }

//   // File upload handler
//   async function handleFileUpload(e) {
//     try {
//       const file = e.target.files[0];
//       if (!file) return;
      
//       setError("");
//       setMessage("");
//       setSuccessMessage("");
//       setEditableText("");
//       setCommand(null);
      
//       setMessage("📁 فائل اپ لوڈ ہو رہی ہے...");
      
//       const wavBlob = await convertToWav(file);
//       const url = URL.createObjectURL(wavBlob);
//       setAudioUrl(url);
//       setAudioSample(wavBlob);
      
//       setMessage("✅ فائل اپ لوڈ ہو گئی");
      
//     } catch (err) {
//       console.error(err);
//       setError("فائل اپ لوڈ میں خرابی");
//     }
//   }

//   // Send voice to get text
//   async function convertVoiceToText() {
//     if (!audioSample) {
//       setError("براہ کرم پہلے آواز ریکارڈ کریں یا فائل اپ لوڈ کریں");
//       return;
//     }
    
//     setIsProcessing(true);
//     setError("");
//     setMessage("");
//     setSuccessMessage("");
//     setEditableText("");
//     setCommand(null);
    
//     try {
//       const formData = new FormData();
//       formData.append("audio", audioSample, "audio.wav");
      
//       setMessage("🎤 آواز کو متن میں تبدیل کیا جا رہا ہے...");
      
//       const response = await axios.post(`${API}/voice-process`, formData, {
//         headers: { "Content-Type": "multipart/form-data" }
//       });
      
//       if (response.data && response.data.text) {
//         const detected = response.data.text;
//         setEditableText(detected);
//         setMessage(`✅ متن مل گیا`);
//         setSuccessMessage("آواز کامیابی سے متن میں تبدیل ہو گئی");
//         setTimeout(() => setSuccessMessage(""), 2000);
//       } else {
//         setError("❌ آواز میں کوئی واضح بات نہیں ہے");
//       }
      
//     } catch (err) {
//       console.error(err);
//       setError(err.response?.data?.detail || "آواز پروسیس کرنے میں خرابی");
//     } finally {
//       setIsProcessing(false);
//     }
//   }

//   // Send text to get JSON command
//   async function convertTextToCommand() {
//     if (!editableText.trim()) {
//       setError("براہ کرم متن درج کریں");
//       return;
//     }
    
//     setIsProcessing(true);
//     setError("");
//     setSuccessMessage("");
//     setCommand(null);
    
//     try {
//       setMessage("🤖 متن سے کمانڈ بنا رہے ہیں...");
      
//       const response = await axios.post(`${API}/text-process`, {
//         text: editableText
//       });
      
//       if (response.data) {
//         let commandJson;
//         try {
//           commandJson = typeof response.data.command === 'string' 
//             ? JSON.parse(response.data.command) 
//             : response.data.command;
//           setCommand(commandJson);
//           setSuccessMessage("✅ کمانڈ مل گئی");
//           setMessage("");
          
//           // Show action type in message
//           let actionName = "";
//           switch(commandJson.action) {
//             case 1: actionName = "شامل کریں"; break;
//             case 2: actionName = "حذف کریں"; break;
//             case 3: actionName = "تلاش کریں"; break;
//             case 4: actionName = "ترمیم کریں"; break;
//             case 5: actionName = "سارا سٹاک"; break;
//             default: actionName = "نامعلوم";
//           }
//           setSuccessMessage(`✅ کمانڈ مل گئی - ایکشن: ${actionName}`);
//           setTimeout(() => setSuccessMessage(""), 2000);
          
//         } catch (e) {
//           setCommand({ raw: response.data.command });
//           setSuccessMessage("✅ کمانڈ مل گئی (خام شکل میں)");
//         }
//       }
      
//     } catch (err) {
//       console.error(err);
//       setError(err.response?.data?.detail || "کمانڈ بنانے میں خرابی");
//     } finally {
//       setIsProcessing(false);
//     }
//   }

//   // Clear everything
//   const clearAll = () => {
//     setAudioSample(null);
//     setAudioUrl(null);
//     setEditableText("");
//     setCommand(null);
//     setMessage("");
//     setError("");
//     setSuccessMessage("");
//     if (audioRef.current) {
//       audioRef.current.src = "";
//     }
//   };

//   // Convert to WAV
//   async function convertToWav(input) {
//     const audioContext = new AudioContext();
//     const arrayBuffer = await input.arrayBuffer();
//     const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
//     const wavBuffer = encodeWAV(audioBuffer);
//     return new Blob([wavBuffer], { type: "audio/wav" });
//   }

//   function encodeWAV(audioBuffer) {
//     const samples = audioBuffer.getChannelData(0);
//     const sampleRate = audioBuffer.sampleRate;

//     const buffer = new ArrayBuffer(44 + samples.length * 2);
//     const view = new DataView(buffer);

//     const writeString = (view, offset, str) => {
//       for (let i = 0; i < str.length; i++) {
//         view.setUint8(offset + i, str.charCodeAt(i));
//       }
//     };

//     writeString(view, 0, "RIFF");
//     view.setUint32(4, 36 + samples.length * 2, true);
//     writeString(view, 8, "WAVE");
//     writeString(view, 12, "fmt ");
//     view.setUint32(16, 16, true);
//     view.setUint16(20, 1, true);
//     view.setUint16(22, 1, true);
//     view.setUint32(24, sampleRate, true);
//     view.setUint32(28, sampleRate * 2, true);
//     view.setUint16(32, 2, true);
//     view.setUint16(34, 16, true);
//     writeString(view, 36, "data");
//     view.setUint32(40, samples.length * 2, true);

//     let offset = 44;
//     for (let i = 0; i < samples.length; i++, offset += 2) {
//       let s = Math.max(-1, Math.min(1, samples[i]));
//       view.setInt16(offset, s * 0x7fff, true);
//     }

//     return buffer;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
//       <div className="max-w-4xl mx-auto">
//         {/* Header */}
//         <div className="bg-white rounded-xl shadow-md p-4 mb-4 text-center">
//           <h1 className="text-2xl font-bold text-gray-800 font-urdu">
//             🎤 وائس کمانڈ سسٹم
//           </h1>
//           <p className="text-gray-500 text-sm mt-1 font-urdu">
//             اپنی آواز سے آئٹم شامل کریں، حذف کریں، ترمیم کریں یا تلاش کریں
//           </p>
//         </div>

//         {/* Voice Recording Section */}
//         <div className="bg-white rounded-xl shadow-md p-6 mb-4">
//           <div className="flex flex-col items-center">
//             {/* Recording Button */}
//             <button
//               onClick={toggleRecording}
//               disabled={isProcessing}
//               className={`relative w-28 h-28 rounded-full transition-all duration-300 ${
//                 isRecording
//                   ? "bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-300 animate-pulse"
//                   : audioSample
//                   ? "bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-300"
//                   : "bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-300 hover:scale-105"
//               } disabled:opacity-50`}
//             >
//               <div className="absolute inset-0 flex items-center justify-center">
//                 {isRecording ? (
//                   <div className="flex gap-1">
//                     <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
//                     <div className="w-1.5 h-8 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                     <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
//                   </div>
//                 ) : audioSample ? (
//                   <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                   </svg>
//                 ) : (
//                   <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
//                   </svg>
//                 )}
//               </div>
//             </button>
            
//             <p className="mt-3 text-sm font-urdu text-gray-600">
//               {isRecording 
//                 ? "🔴 ریکارڈنگ جاری ہے..." 
//                 : audioSample 
//                 ? "✅ آواز ریکارڈ ہو چکی ہے" 
//                 : "ریکارڈ کرنے کے لیے دبائیں"}
//             </p>

//             {/* Audio Player */}
//             {audioSample && (
//               <div className="w-full mt-4">
//                 <audio ref={audioRef} controls src={audioUrl} className="w-full h-10 rounded-lg" />
//               </div>
//             )}

//             {/* File Upload Option */}
//             <div className="w-full mt-4">
//               <label className="block text-sm font-urdu text-gray-600 mb-2 text-right">
//                 یا فائل اپ لوڈ کریں:
//               </label>
//               <input
//                 type="file"
//                 accept="audio/*"
//                 onChange={handleFileUpload}
//                 className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
//               />
//             </div>

//             {/* Action Buttons */}
//             {audioSample && (
//               <div className="flex gap-3 mt-4 w-full">
//                 <button
//                   onClick={convertVoiceToText}
//                   disabled={isProcessing}
//                   className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 rounded-lg font-urdu text-sm font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
//                 >
//                   {isProcessing ? (
//                     <>
//                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                       <span>تبدیل ہو رہا ہے...</span>
//                     </>
//                   ) : (
//                     "🎤 آواز کو متن میں تبدیل کریں"
//                   )}
//                 </button>
//                 <button
//                   onClick={clearAll}
//                   className="px-4 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
//                 >
//                   صاف کریں
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Text Area Section */}
//         <div className="bg-white rounded-xl shadow-md p-4 mb-4">
//           <label className="block text-sm font-urdu text-gray-700 mb-2 text-right">
//             📝 تبدیل شدہ متن:
//           </label>
//           <textarea
//             value={editableText}
//             onChange={(e) => setEditableText(e.target.value)}
//             placeholder="آواز سے تبدیل شدہ متن یہاں ظاہر ہوگا..."
//             className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 text-sm min-h-[120px]"
//             dir="rtl"
//           />
          
//           {editableText && (
//             <div className="flex gap-3 mt-3">
//               <button
//                 onClick={convertTextToCommand}
//                 disabled={isProcessing}
//                 className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg font-urdu text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
//               >
//                 {isProcessing ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                     <span>کمانڈ بنا رہا ہے...</span>
//                   </>
//                 ) : (
//                   "🤖 متن کو کمانڈ میں تبدیل کریں"
//                 )}
//               </button>
//               <button
//                 onClick={() => setEditableText("")}
//                 className="px-4 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
//               >
//                 صاف کریں
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Messages */}
//         {(message || error || successMessage) && (
//           <div className="bg-white rounded-xl shadow-md p-3">
//             {message && (
//               <div className="p-2 bg-blue-100 border border-blue-400 text-blue-700 rounded text-right text-sm mb-2 font-urdu">
//                 ℹ️ {message}
//               </div>
//             )}
//             {error && (
//               <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-right text-sm mb-2 font-urdu">
//                 ❌ {error}
//               </div>
//             )}
//             {successMessage && (
//               <div className="p-2 bg-green-100 border border-green-400 text-green-700 rounded text-right text-sm font-urdu">
//                 ✅ {successMessage}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Help Section */}
//         <div className="bg-white rounded-xl shadow-md p-4 mt-4">
//           <h3 className="text-sm font-bold text-gray-800 mb-2 font-urdu text-right">
//             📖 مدد (Help)
//           </h3>
//           <div className="text-right text-xs text-gray-600 space-y-1 font-urdu">
//             <p>• <strong>آئٹم شامل کریں:</strong> "10 کلو دالدا گھی ڈال دو فی کلو 100 روپے"</p>
//             <p>• <strong>آئٹم حذف کریں:</strong> "دالدا گھی حذف کرو"</p>
//             <p>• <strong>آئٹم ترمیم کریں:</strong> "دالدا گھی کی قیمت 120 روپے کرو"</p>
//             <p>• <strong>آئٹم تلاش کریں:</strong> "دالدا گھی تلاش کرو"</p>
//             <p>• <strong>سارا سٹاک دیکھیں:</strong> "سارا سٹاک دکھاؤ"</p>
//           </div>
//         </div>
//       </div>

//       {/* Items Popup Modal */}
//       {showItemsPopup && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex justify-center items-center p-4 overflow-y-auto">
//           <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto">
//             <Items 
//               onItemAdded={() => {
//                 setShowItemsPopup(false);
//                 setAutoFillData(null);
//                 setPendingCommand(null);
//                 setExternalSearch(null);
//                 setCommand(null);
//                 setSuccessMessage("آپریشن کامیابی سے مکمل ہو گیا");
//                 setTimeout(() => setSuccessMessage(""), 2000);
//               }}
//               onClose={() => {
//                 setShowItemsPopup(false);
//                 setAutoFillData(null);
//                 setPendingCommand(null);
//                 setExternalSearch(null);
//               }}
//               voiceCommand={pendingCommand}
//               autoFillData={autoFillData}
//               externalSearch={externalSearch}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default MainPage;