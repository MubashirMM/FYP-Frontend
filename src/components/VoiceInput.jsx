// import { useState, useRef, useEffect } from "react";
// import axiosInstance from "../utils/axiosInstance";

// function VoiceInput({ onCommandReceived, onClose, feature = "items" }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioSample, setAudioSample] = useState(null);
//   const [audioUrl, setAudioUrl] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
  
//   const mediaRecorderRef = useRef(null);
//   const chunksRef = useRef([]);
//   const streamRef = useRef(null);
//   const audioRef = useRef(null);
//   const fileInputRef = useRef(null);

//   // Cleanup on component unmount only
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
          
//           // Check if blob is too small (silent recording)
//           if (blob.size < 5000) {
//             setError("❌ کوئی آواز ریکارڈ نہیں ہوئی۔ براہ کرم دوبارہ بولیں");
//             setIsRecording(false);
//             if (streamRef.current) {
//               streamRef.current.getTracks().forEach(track => track.stop());
//             }
//             return;
//           }
          
//           const wavBlob = await convertToWav(blob);
          
//           const url = URL.createObjectURL(wavBlob);
//           setAudioUrl(url);
//           setAudioSample(wavBlob);
          
//           setMessage("✅ آواز ریکارڈ ہو گئی");
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

//   // Handle file upload
//   async function handleFileUpload(e) {
//     try {
//       const file = e.target.files[0];
//       if (!file) return;
      
//       setError("");
//       setMessage("");
      
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

//   // Convert blob to base64
//   const blobToBase64 = (blob) => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         const base64 = reader.result.split(',')[1];
//         resolve(base64);
//       };
//       reader.onerror = reject;
//       reader.readAsDataURL(blob);
//     });
//   };

//   // Process voice and silently fill form (no JSON display)
//   async function processVoiceToCommand() {
//     if (!audioSample) {
//       setError("براہ کرم پہلے آواز ریکارڈ کریں یا فائل اپ لوڈ کریں");
//       return;
//     }
    
//     setIsProcessing(true);
//     setError("");
//     setMessage("");
    
//     try {
//       // Convert blob to base64
//       const audio_base64 = await blobToBase64(audioSample);
      
//       setMessage("🎤 آواز پروسیس ہو رہی ہے...");
      
//       // Send as JSON with base64
//       const response = await axiosInstance.post(`/voice-process-items`, {
//         audio_base64: audio_base64
//       });
      
//       console.log("Response:", response.data);
      
//       // Check for invalid action (action: 0)
//       if (response.data && response.data.action === 0) {
//         // Show error message from backend
//         setError(`❌ ${response.data.message || "یہ کمانڈ یہاں پروسیس نہیں کی جا سکتی۔ براہ کرم صرف آئٹمز سے متعلق کمانڈ دیں۔"}`);
//         setMessage("");
//         setIsProcessing(false);
//         return;
//       }
      
//       // Check for error in response
//       if (response.data && response.data.error) {
//         setError(`❌ ${response.data.error}`);
//         setMessage("");
//         setIsProcessing(false);
//         return;
//       }
      
//       // Success - silently send data to parent form (don't show JSON)
//       if (response.data && (response.data.action || response.data.items)) {
//         setMessage("✅ کمانڈ کامیابی سے پروسیس ہو گئی!");
        
//         // Send command data to parent component (to fill form silently)
//         if (onCommandReceived) {
//           onCommandReceived(response.data);
//         }
        
//         // Clear the audio and close after success
//         setTimeout(() => {
//           clearAll();
//           setIsOpen(false);
//           if (onClose) onClose();
//         }, 1500);
        
//       } else {
//         // Unknown response
//         setError("❌ کمانڈ سمجھ نہیں آئی۔ براہ کرم واضح بولے");
//         setMessage("");
//       }
      
//     } catch (err) {
//       console.error(err);
      
//       // Handle different error types
//       if (err.response?.status === 401) {
//         setError("❌ آپ لاگ ان نہیں ہیں۔ براہ کرم پہلے لاگ ان کریں");
//       } else if (err.response?.data?.detail) {
//         const errorDetail = err.response.data.detail;
//         if (typeof errorDetail === 'object' && errorDetail.error) {
//           setError(`❌ ${errorDetail.error}`);
//         } else if (typeof errorDetail === 'object' && errorDetail.message) {
//           setError(`❌ ${errorDetail.message}`);
//         } else {
//           setError(`❌ ${errorDetail}`);
//         }
//       } else if (err.code === "ECONNABORTED") {
//         setError("❌ کنکشن ٹائم آؤٹ۔ انٹرنیٹ چیک کریں");
//       } else {
//         setError("❌ پروسیسنگ میں خرابی۔ براہ کرم دوبارہ کوشش کریں");
//       }
//       setMessage("");
      
//     } finally {
//       setIsProcessing(false);
//     }
//   }

//   // Clear everything
//   const clearAll = () => {
//     setAudioSample(null);
//     setAudioUrl(null);
//     setMessage("");
//     setError("");
//     setIsProcessing(false);
//     if (audioRef.current) {
//       audioRef.current.src = "";
//     }
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   // Convert to WAV with proper format (16kHz mono)
//   async function convertToWav(input) {
//     const audioContext = new AudioContext({ sampleRate: 16000 });
//     const arrayBuffer = await input.arrayBuffer();
//     const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
//     // Convert to mono
//     const numberOfChannels = 1;
//     const sampleRate = 16000;
//     const length = audioBuffer.length;
    
//     const newBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);
    
//     if (audioBuffer.numberOfChannels === 1) {
//       newBuffer.copyToChannel(audioBuffer.getChannelData(0), 0);
//     } else {
//       const left = audioBuffer.getChannelData(0);
//       const right = audioBuffer.getChannelData(1);
//       const mono = new Float32Array(length);
//       for (let i = 0; i < length; i++) {
//         mono[i] = (left[i] + right[i]) / 2;
//       }
//       newBuffer.copyToChannel(mono, 0);
//     }
    
//     const wavBuffer = encodeWAV(newBuffer);
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

//   // Get feature title
//   const getFeatureTitle = () => {
//     switch(feature) {
//       case "items": return "📦 آئٹمز کمانڈ";
//       case "udhaar": return "💰 اُدھار کمانڈ";
//       case "bills": return "🧾 بل کمانڈ";
//       default: return "🎤 وائس کمانڈ";
//     }
//   };

//   return (
//     <>
//       {/* Toggle Button */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className={`fixed bottom-6 left-0 z-50 bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 shadow-lg flex items-center gap-2 ${
//           isOpen 
//             ? "translate-x-0 rounded-r-full py-3 px-4" 
//             : "translate-x-0 rounded-r-full py-3 px-4 hover:pr-6"
//         }`}
//         style={{ left: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
//       >
//         {isOpen ? (
//           <>
//             <span className="text-sm font-urdu">بند کریں</span>
//             <span className="text-lg">→</span>
//           </>
//         ) : (
//           <>
//             <span className="text-lg">←</span>
//             <span className="text-sm font-urdu">وائس کمانڈ</span>
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
//             </svg>
//           </>
//         )}
//       </button>

//       {/* Voice Input Panel */}
//       <div
//         className={`fixed bottom-20 left-0 z-40 bg-white rounded-r-2xl shadow-2xl transition-all duration-300 overflow-hidden ${
//           isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
//         }`}
//         style={{ width: "400px", maxWidth: "85vw" }}
//       >
//         <div className="p-4">
//           {/* Header */}
//           <div className="text-center mb-3 pb-2 border-b">
//             <h3 className="text-md font-bold text-gray-800 font-urdu">{getFeatureTitle()}</h3>
//             <p className="text-xs text-gray-500 font-urdu">اپنی آواز سے کمانڈ کریں</p>
//           </div>

//           {/* Recording Section */}
//           <div className="flex items-center gap-2 mb-3">
//             <button
//               onClick={toggleRecording}
//               disabled={isProcessing}
//               className={`flex-shrink-0 w-12 h-12 rounded-full transition-all ${
//                 isRecording
//                   ? "bg-red-500 animate-pulse"
//                   : audioSample
//                   ? "bg-green-500"
//                   : "bg-purple-500"
//               }`}
//             >
//               {isRecording ? (
//                 <div className="flex justify-center gap-1">
//                   <div className="w-1 h-3 bg-white rounded-full animate-bounce"></div>
//                   <div className="w-1 h-5 bg-white rounded-full animate-bounce"></div>
//                   <div className="w-1 h-3 bg-white rounded-full animate-bounce"></div>
//                 </div>
//               ) : audioSample ? (
//                 <svg className="w-5 h-5 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                 </svg>
//               ) : (
//                 <svg className="w-5 h-5 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
//                 </svg>
//               )}
//             </button>
            
//             <div className="flex-1 text-right">
//               <p className="text-xs text-gray-500 font-urdu">
//                 {isRecording 
//                   ? "🔴 ریکارڈنگ جاری ہے..." 
//                   : audioSample 
//                   ? "✅ آواز ریکارڈ ہو چکی ہے" 
//                   : "ریکارڈ کرنے کے لیے دبائیں"}
//               </p>
//             </div>

//             {/* File Upload Button */}
//             <label className="cursor-pointer">
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="audio/*"
//                 onChange={handleFileUpload}
//                 className="hidden"
//                 disabled={isProcessing}
//               />
//               <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
//                 <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
//                 </svg>
//               </div>
//             </label>
//           </div>

//           {/* Audio Player */}
//           {audioSample && (
//             <div className="mb-3">
//               <audio ref={audioRef} controls src={audioUrl} className="w-full h-8 rounded-lg" />
//             </div>
//           )}

//           {/* Process Button */}
//           {audioSample && (
//             <button
//               onClick={processVoiceToCommand}
//               disabled={isProcessing}
//               className={`w-full py-2 rounded-lg mb-3 text-sm font-urdu transition-all ${
//                 isProcessing 
//                   ? "bg-gray-400 cursor-not-allowed" 
//                   : "bg-purple-600 hover:bg-purple-700 text-white"
//               }`}
//             >
//               {isProcessing ? (
//                 <div className="flex items-center justify-center gap-2">
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   <span>پروسیسنگ جاری ہے...</span>
//                 </div>
//               ) : (
//                 "🎤 کمانڈ پر عمل کریں"
//               )}
//             </button>
//           )}

//           {/* Clear Button */}
//           {audioSample && (
//             <button
//               onClick={clearAll}
//               disabled={isProcessing}
//               className="w-full bg-gray-500 text-white py-2 rounded-lg text-sm font-urdu transition-all hover:bg-gray-600 disabled:bg-gray-300"
//             >
//               🔄 سب صاف کریں
//             </button>
//           )}

//           {/* Messages - Only show status and errors, NOT JSON */}
//           {message && !error && (
//             <div className="mt-3 p-2 bg-blue-100 border border-blue-400 text-blue-700 rounded text-right text-xs font-urdu">
//               {message}
//             </div>
//           )}
          
//           {error && (
//             <div className="mt-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-right text-xs font-urdu">
//               {error}
//             </div>
//           )}

//           {/* Help Text */}
//           <div className="mt-3 pt-2 border-t text-center">
//             <p className="text-xs text-gray-400 font-urdu">
//               مثالیں: "10 کلو چاول ڈال دو" | "چاول حذف کرو" | "چاول تلاش کرو"
//             </p>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default VoiceInput;


import { useState, useRef, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

function VoiceInput({ onCommandReceived, onClose, feature = "items" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioSample, setAudioSample] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get API endpoint based on feature
  const getApiEndpoint = () => {
    switch (feature) {
      case "items":
        return "/voice-process-items";
      case "udhar-items":
        return "/voice-process-udhar-items";
      case "bills":
        return "/voice-process-bills";
      case "sales":
        return "/voice-process-sales";
      default:
        return "/voice-process-items";
    }
  };

  // Get feature title
  const getFeatureTitle = () => {
    switch(feature) {
      case "items": return "📦 آئٹمز کمانڈ";
      case "udhaar": return "💰 ادھار کمانڈ";
      case "bills": return "🧾 بل کمانڈ";
      case "sales": return "📊 سیلز کمانڈ";
      default: return "🎤 وائس کمانڈ";
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  async function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }

  async function startRecording() {
    try {
      setError("");
      setMessage("");
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          
          if (blob.size < 5000) {
            setError("❌ کوئی آواز ریکارڈ نہیں ہوئی۔ براہ کرم دوبارہ بولیں");
            setIsRecording(false);
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            return;
          }
          
          const wavBlob = await convertToWav(blob);
          const url = URL.createObjectURL(wavBlob);
          setAudioUrl(url);
          setAudioSample(wavBlob);
          setMessage("✅ آواز ریکارڈ ہو گئی");
          setIsRecording(false);
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
        } catch (err) {
          console.error(err);
          setError("ریکارڈ محفوظ کرنے میں خرابی");
          setIsRecording(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setMessage("🔴 ریکارڈنگ جاری ہے...");
    } catch {
      setError("مائیکروفون تک رسائی نہیں ملی");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setMessage("⏹️ ریکارڈنگ بند کر دی گئی");
    }
  }

  async function handleFileUpload(e) {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setError("");
      setMessage("");
      setMessage("📁 فائل اپ لوڈ ہو رہی ہے...");
      const wavBlob = await convertToWav(file);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
      setAudioSample(wavBlob);
      setMessage("✅ فائل اپ لوڈ ہو گئی");
    } catch (err) {
      console.error(err);
      setError("فائل اپ لوڈ میں خرابی");
    }
  }

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  async function processVoiceToCommand() {
    if (!audioSample) {
      setError("براہ کرم پہلے آواز ریکارڈ کریں یا فائل اپ لوڈ کریں");
      return;
    }
    
    setIsProcessing(true);
    setError("");
    setMessage("");
    
    try {
      const audio_base64 = await blobToBase64(audioSample);
      setMessage("🎤 آواز پروسیس ہو رہی ہے...");
      
      const endpoint = getApiEndpoint();
      const response = await axiosInstance.post(endpoint, {
        audio_base64: audio_base64
      });
      
      console.log("Response:", response.data);
      
      if (response.data && response.data.action === 0) {
        setError(`❌ ${response.data.message || "یہ کمانڈ یہاں پروسیس نہیں کی جا سکتی۔ براہ کرم صرف متعلقہ کمانڈ دیں۔"}`);
        setMessage("");
        setIsProcessing(false);
        return;
      }
      
      if (response.data && response.data.error) {
        setError(`❌ ${response.data.error}`);
        setMessage("");
        setIsProcessing(false);
        return;
      }
      
      if (response.data) {
        setMessage("✅ کمانڈ کامیابی سے پروسیس ہو گئی!");
        
        if (onCommandReceived) {
          onCommandReceived(response.data);
        }
        
        setTimeout(() => {
          clearAll();
          setIsOpen(false);
          if (onClose) onClose();
        }, 1500);
      } else {
        setError("❌ کمانڈ سمجھ نہیں آئی۔ براہ کرم واضح بولے");
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      
      if (err.response?.status === 401) {
        setError("❌ آپ لاگ ان نہیں ہیں۔ براہ کرم پہلے لاگ ان کریں");
      } else if (err.response?.data?.detail) {
        const errorDetail = err.response.data.detail;
        if (typeof errorDetail === 'object' && errorDetail.error) {
          setError(`❌ ${errorDetail.error}`);
        } else if (typeof errorDetail === 'object' && errorDetail.message) {
          setError(`❌ ${errorDetail.message}`);
        } else {
          setError(`❌ ${errorDetail}`);
        }
      } else if (err.code === "ECONNABORTED") {
        setError("❌ کنکشن ٹائم آؤٹ۔ انٹرنیٹ چیک کریں");
      } else {
        setError("❌ پروسیسنگ میں خرابی۔ براہ کرم دوبارہ کوشش کریں");
      }
      setMessage("");
    } finally {
      setIsProcessing(false);
    }
  }

  const clearAll = () => {
    setAudioSample(null);
    setAudioUrl(null);
    setMessage("");
    setError("");
    setIsProcessing(false);
    if (audioRef.current) {
      audioRef.current.src = "";
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function convertToWav(input) {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const arrayBuffer = await input.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const numberOfChannels = 1;
    const sampleRate = 16000;
    const length = audioBuffer.length;
    
    const newBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);
    
    if (audioBuffer.numberOfChannels === 1) {
      newBuffer.copyToChannel(audioBuffer.getChannelData(0), 0);
    } else {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      const mono = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        mono[i] = (left[i] + right[i]) / 2;
      }
      newBuffer.copyToChannel(mono, 0);
    }
    
    const wavBuffer = encodeWAV(newBuffer);
    return new Blob([wavBuffer], { type: "audio/wav" });
  }

  function encodeWAV(audioBuffer) {
    const samples = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view, offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s * 0x7fff, true);
    }

    return buffer;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-0 z-50 bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 shadow-lg flex items-center gap-2 ${
          isOpen 
            ? "translate-x-0 rounded-r-full py-3 px-4" 
            : "translate-x-0 rounded-r-full py-3 px-4 hover:pr-6"
        }`}
        style={{ left: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
      >
        {isOpen ? (
          <>
            <span className="text-sm font-urdu">بند کریں</span>
            <span className="text-lg">→</span>
          </>
        ) : (
          <>
            <span className="text-lg">←</span>
            <span className="text-sm font-urdu">وائس کمانڈ</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </>
        )}
      </button>

      <div
        className={`fixed bottom-20 left-0 z-40 bg-white rounded-r-2xl shadow-2xl transition-all duration-300 overflow-hidden ${
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
        }`}
        style={{ width: "400px", maxWidth: "85vw" }}
      >
        <div className="p-4">
          <div className="text-center mb-3 pb-2 border-b">
            <h3 className="text-md font-bold text-gray-800 font-urdu">{getFeatureTitle()}</h3>
            <p className="text-xs text-gray-500 font-urdu">اپنی آواز سے کمانڈ کریں</p>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`flex-shrink-0 w-12 h-12 rounded-full transition-all ${
                isRecording
                  ? "bg-red-500 animate-pulse"
                  : audioSample
                  ? "bg-green-500"
                  : "bg-purple-500"
              }`}
            >
              {isRecording ? (
                <div className="flex justify-center gap-1">
                  <div className="w-1 h-3 bg-white rounded-full animate-bounce"></div>
                  <div className="w-1 h-5 bg-white rounded-full animate-bounce"></div>
                  <div className="w-1 h-3 bg-white rounded-full animate-bounce"></div>
                </div>
              ) : audioSample ? (
                <svg className="w-5 h-5 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            
            <div className="flex-1 text-right">
              <p className="text-xs text-gray-500 font-urdu">
                {isRecording 
                  ? "🔴 ریکارڈنگ جاری ہے..." 
                  : audioSample 
                  ? "✅ آواز ریکارڈ ہو چکی ہے" 
                  : "ریکارڈ کرنے کے لیے دبائیں"}
              </p>
            </div>

            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
            </label>
          </div>

          {audioSample && (
            <div className="mb-3">
              <audio ref={audioRef} controls src={audioUrl} className="w-full h-8 rounded-lg" />
            </div>
          )}

          {audioSample && (
            <button
              onClick={processVoiceToCommand}
              disabled={isProcessing}
              className={`w-full py-2 rounded-lg mb-3 text-sm font-urdu transition-all ${
                isProcessing 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>پروسیسنگ جاری ہے...</span>
                </div>
              ) : (
                "🎤 کمانڈ پر عمل کریں"
              )}
            </button>
          )}

          {audioSample && (
            <button
              onClick={clearAll}
              disabled={isProcessing}
              className="w-full bg-gray-500 text-white py-2 rounded-lg text-sm font-urdu transition-all hover:bg-gray-600 disabled:bg-gray-300"
            >
              🔄 سب صاف کریں
            </button>
          )}

          {message && !error && (
            <div className="mt-3 p-2 bg-blue-100 border border-blue-400 text-blue-700 rounded text-right text-xs font-urdu">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mt-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-right text-xs font-urdu">
              {error}
            </div>
          )}

          <div className="mt-3 pt-2 border-t text-center">
            <p className="text-xs text-gray-400 font-urdu">
              {feature === "items" && "مثالیں: \"10 کلو چاول ڈال دو\" | \"چاول حذف کرو\" | \"چاول تلاش کرو\""}
              {feature === "udhaar" && "مثالیں: \"علی کے کھاتے میں 20 کلو چاول ڈال دو\" | \"علی کا چاول حذف کرو\" | \"علی کا ادھار تلاش کرو\""}
              {feature === "bills" && "مثالیں: \"10 کلو چاول کا بل بنا دو\""}
              {feature === "sales" && "مثالیں: \"آج کی سیلز بتاؤ\" | \"کل کی فروخت کتنی تھی\""}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default VoiceInput;