import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function MainPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioSample, setAudioSample] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [editableText, setEditableText] = useState("");
  const [command, setCommand] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const navigate = useNavigate();
  
  const API = import.meta.env.VITE_API_URL;

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Cleanup on unmount
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
      setSuccessMessage("");
      
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

  // File upload handler
  async function handleFileUpload(e) {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      setError("");
      setMessage("");
      setSuccessMessage("");
      setEditableText("");
      setCommand(null);
      
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

  // Send voice to get text and show in textarea
  async function convertVoiceToText() {
    if (!audioSample) {
      setError("براہ کرم پہلے آواز ریکارڈ کریں یا فائل اپ لوڈ کریں");
      return;
    }
    
    setIsProcessing(true);
    setError("");
    setMessage("");
    setSuccessMessage("");
    setEditableText("");
    setCommand(null);
    
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
        setSuccessMessage("آواز کامیابی سے متن میں تبدیل ہو گئی");
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

  // Send text to get JSON command
  async function convertTextToCommand() {
    if (!editableText.trim()) {
      setError("براہ کرم متن درج کریں");
      return;
    }
    
    setIsProcessing(true);
    setError("");
    setSuccessMessage("");
    setCommand(null);
    
    try {
      setMessage("🤖 متن سے کمانڈ بنا رہے ہیں...");
      
      const response = await axios.post(`${API}/text-process`, {
        text: editableText
      });
      
      if (response.data) {
        let commandJson;
        try {
          commandJson = typeof response.data.command === 'string' 
            ? JSON.parse(response.data.command) 
            : response.data.command;
          setCommand(commandJson);
          setSuccessMessage("✅ کمانڈ مل گئی");
          setMessage("");
          
        } catch (e) {
          setCommand({ raw: response.data.command });
          setSuccessMessage("✅ کمانڈ مل گئی");
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
    setCommand(null);
    setMessage("");
    setError("");
    setSuccessMessage("");
    if (audioRef.current) {
      audioRef.current.src = "";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-3 mb-4 text-center">
          <h1 className="text-xl font-bold text-gray-800 font-urdu">
            🎤 وائس کمانڈ
          </h1>
        </div>

        {/* Voice Recording Section - Small Height */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex flex-col items-center">
            {/* Recording Button - Smaller */}
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`relative w-24 h-24 rounded-full transition-all duration-300 ${
                isRecording
                  ? "bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-300 animate-pulse"
                  : audioSample
                  ? "bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-300"
                  : "bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-300 hover:scale-105"
              } disabled:opacity-50`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {isRecording ? (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-7 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                ) : audioSample ? (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </div>
            </button>
            
            <p className="mt-2 text-xs font-urdu text-gray-600">
              {isRecording 
                ? "🔴 ریکارڈنگ جاری ہے..." 
                : audioSample 
                ? "✅ آواز ریکارڈ ہو چکی ہے" 
                : "ریکارڈ کرنے کے لیے دبائیں"}
            </p>

            {/* Audio Player - Compact */}
            {audioSample && (
              <div className="w-full mt-3">
                <audio ref={audioRef} controls src={audioUrl} className="w-full h-8 rounded-lg" />
              </div>
            )}

            {/* File Upload Option */}
            <div className="w-full mt-3">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
              />
            </div>

            {/* Clear Button */}
            {audioSample && (
              <button
                onClick={clearAll}
                className="mt-2 px-3 py-1 bg-gray-500 text-white rounded-lg text-xs hover:bg-gray-600 transition-colors"
              >
                صاف کریں
              </button>
            )}
          </div>
        </div>

        {/* Convert Button */}
        {audioSample && (
          <button
            onClick={convertVoiceToText}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 rounded-xl font-urdu text-base font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 mb-4 flex items-center justify-center gap-2 shadow-md"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>تبدیل ہو رہا ہے...</span>
              </>
            ) : (
              "🎤 آواز کو متن میں تبدیل کریں"
            )}
          </button>
        )}

        {/* Text Area Section */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            placeholder="آواز سے تبدیل شدہ متن یہاں ظاہر ہوگا..."
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 text-sm min-h-[100px]"
            dir="rtl"
          />
          
          {editableText && (
            <button
              onClick={convertTextToCommand}
              disabled={isProcessing}
              className="w-full mt-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg font-urdu text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>کمانڈ بنا رہا ہے...</span>
                </>
              ) : (
                "🤖 متن کو کمانڈ میں تبدیل کریں"
              )}
            </button>
          )}
        </div>

        {/* JSON Response Section */}
        {command && (
          <div className="bg-white rounded-xl shadow-md p-3 mb-4">
            <h3 className="text-sm font-bold text-gray-800 mb-2 font-urdu text-right">
              📋 کمانڈ کا جواب:
            </h3>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-2 border border-purple-200">
              <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(command, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Messages */}
        {(message || error || successMessage) && (
          <div className="bg-white rounded-xl shadow-md p-2">
            {message && (
              <div className="p-1.5 bg-blue-100 border border-blue-400 text-blue-700 rounded text-right text-xs mb-1">
                {message}
              </div>
            )}
            {error && (
              <div className="p-1.5 bg-red-100 border border-red-400 text-red-700 rounded text-right text-xs mb-1">
                ❌ {error}
              </div>
            )}
            {successMessage && (
              <div className="p-1.5 bg-green-100 border border-green-400 text-green-700 rounded text-right text-xs">
                ✅ {successMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MainPage;