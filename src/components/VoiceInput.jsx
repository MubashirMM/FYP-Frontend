import { useState, useRef, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function VoiceInput({ onCommandReceived, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioSample, setAudioSample] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [editableText, setEditableText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // Toggle recording
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
          const wavBlob = await convertToWav(blob);
          
          const url = URL.createObjectURL(wavBlob);
          setAudioUrl(url);
          setAudioSample(wavBlob);
          
          setMessage("✅ ریکارڈ محفوظ ہو گیا");
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

  // Handle file upload
  async function handleFileUpload(e) {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      setError("");
      setMessage("");
      setEditableText("");
      
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

  // Convert voice to text
  async function convertVoiceToText() {
    if (!audioSample) {
      setError("براہ کرم پہلے آواز ریکارڈ کریں یا فائل اپ لوڈ کریں");
      return;
    }
    
    setIsProcessing(true);
    setError("");
    setMessage("");
    
    try {
      const formData = new FormData();
      formData.append("audio", audioSample, "audio.wav");
      
      setMessage("🎤 آواز کو متن میں تبدیل کیا جا رہا ہے...");
      
      const response = await axios.post(`${API}/voice-process`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (response.data && response.data.text) {
        const detected = response.data.text;
        setEditableText(detected);
        setMessage(`✅ متن مل گیا`);
      } else {
        setError("❌ آواز میں کوئی واضح بات نہیں ہے");
      }
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "آواز پروسیس کرنے میں خرابی");
    } finally {
      setIsProcessing(false);
    }
  }

  // Convert text to command and send to parent
  async function convertTextToCommand() {
    if (!editableText.trim()) {
      setError("براہ کرم متن درج کریں");
      return;
    }
    
    setIsProcessing(true);
    setError("");
    
    try {
      setMessage("🤖 کمانڈ بنا رہے ہیں...");
      
      const response = await axios.post(`${API}/text-process`, {
        text: editableText
      });
      
      if (response.data) {
        let commandJson;
        try {
          commandJson = typeof response.data.command === 'string' 
            ? JSON.parse(response.data.command) 
            : response.data.command;
          
          setMessage("✅ کمانڈ مل گئی");
          
          // Send command to parent page
          if (onCommandReceived) {
            onCommandReceived(commandJson);
          }
          
          // Clear and close after successful command
          setTimeout(() => {
            clearAll();
            setIsOpen(false);
          }, 1500);
          
        } catch (e) {
          setError("کمانڈ فارم میں خرابی");
        }
      }
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "کمانڈ بنانے میں خرابی");
    } finally {
      setIsProcessing(false);
    }
  }

  // Clear everything
  const clearAll = () => {
    setAudioSample(null);
    setAudioUrl(null);
    setEditableText("");
    setMessage("");
    setError("");
    if (audioRef.current) {
      audioRef.current.src = "";
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Convert to WAV
  async function convertToWav(input) {
    const audioContext = new AudioContext();
    const arrayBuffer = await input.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wavBuffer = encodeWAV(audioBuffer);
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
      {/* Toggle Button - Left side, vertical/horizontal design */}
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

      {/* Voice Input Panel - Slides from left */}
      <div
        className={`fixed bottom-20 left-0 z-40 bg-white rounded-r-2xl shadow-2xl transition-all duration-300 overflow-hidden ${
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
        }`}
        style={{ width: "380px", maxWidth: "85vw" }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="text-center mb-3 pb-2 border-b">
            <h3 className="text-md font-bold text-gray-800 font-urdu">🎤 وائس کمانڈ</h3>
            <p className="text-xs text-gray-500 font-urdu">اپنی آواز سے کمانڈ کریں</p>
          </div>

          {/* Recording Section - Horizontal layout */}
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

            {/* File Upload Button */}
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
            </label>
          </div>

          {/* Audio Player (if recorded) */}
          {audioSample && (
            <div className="mb-3">
              <audio ref={audioRef} controls src={audioUrl} className="w-full h-8 rounded-lg" />
            </div>
          )}

          {/* Convert to Text Button */}
          {audioSample && (
            <button
              onClick={convertVoiceToText}
              disabled={isProcessing}
              className="w-full bg-purple-600 text-white py-2 rounded-lg mb-3 text-sm font-urdu transition-all hover:bg-purple-700"
            >
              {isProcessing ? "⏳ پروسیسنگ..." : "🎤 آواز کو متن میں تبدیل کریں"}
            </button>
          )}

          {/* Text Area */}
          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            placeholder="تبدیل شدہ متن یہاں ظاہر ہوگا..."
            className="w-full p-3 border-2 border-gray-200 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 text-sm min-h-[80px] mb-3"
            dir="rtl"
          />

          {/* Action Buttons Row */}
          {editableText && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={convertTextToCommand}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-urdu transition-all hover:bg-blue-700"
              >
                {isProcessing ? "⏳ پروسیسنگ..." : "🤖 کمانڈ پر بھیجیں"}
              </button>
              <button
                onClick={() => setEditableText("")}
                className="px-4 bg-gray-500 text-white py-2 rounded-lg text-sm font-urdu transition-all hover:bg-gray-600"
              >
                صاف
              </button>
            </div>
          )}

          {/* Clear All Button */}
          {audioSample && (
            <button
              onClick={clearAll}
              className="w-full bg-gray-500 text-white py-2 rounded-lg text-sm font-urdu transition-all hover:bg-gray-600"
            >
              🔄 سب صاف کریں
            </button>
          )}

          {/* Messages */}
          {(message || error) && (
            <div className="mt-3">
              {message && (
                <div className="p-2 bg-blue-100 border border-blue-400 text-blue-700 rounded text-right text-xs font-urdu">
                  {message}
                </div>
              )}
              {error && (
                <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-right text-xs font-urdu">
                  ❌ {error}
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          <div className="mt-3 pt-2 border-t text-center">
            <p className="text-xs text-gray-400 font-urdu">
              مثالیں: "10 کلو چاول ڈال دو" | "چاول حذف کرو" | "چاول تلاش کرو"
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default VoiceInput;