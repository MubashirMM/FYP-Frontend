import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function VoiceLogin() {
  const [email, setEmail] = useState("");
  const [loginSample, setLoginSample] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Validate email
  const validateEmail = () => {
    if (!email.trim()) {
      setError("ای میل درج کریں");
      return false;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("درست ای میل ایڈریس درج کریں");
      return false;
    }
    return true;
  };

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
          const blob = new Blob(chunksRef.current);
          const wavBlob = await convertToWav(blob);
          const base64 = await blobToBase64(wavBlob);
          
          setLoginSample(base64);

          const audioEl = document.getElementById("audioLogin");
          if (audioEl) audioEl.src = URL.createObjectURL(wavBlob);

          setMessage("✅ آواز ریکارڈ ہو گئی۔ اب لاگ ان کریں");
          setIsRecording(false);

          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          
          setTimeout(() => setMessage(""), 3000);
          
        } catch (err) {
          console.error(err);
          setError("ریکارڈ محفوظ کرنے میں خرابی");
          setIsRecording(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setMessage("🔴 آواز ریکارڈ ہو رہی ہے... بند کرنے کے لیے دبائیں");

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

  // File upload
  async function uploadFile(e) {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setMessage("📁 فائل اپ لوڈ ہو رہی ہے...");
      setError("");

      const wavBlob = await convertToWav(file);
      const base64 = await blobToBase64(wavBlob);
      
      setLoginSample(base64);

      const audioEl = document.getElementById("audioLogin");
      if (audioEl) audioEl.src = URL.createObjectURL(wavBlob);

      setMessage("✅ فائل اپ لوڈ ہو گئی۔ اب لاگ ان کریں");
      
      setTimeout(() => setMessage(""), 3000);
      
    } catch (err) {
      console.error(err);
      setError("فائل اپ لوڈ میں خرابی");
    }
  }

  // Convert to WAV
  async function convertToWav(blob) {
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
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

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Send login
  async function sendLogin() {
    setError("");
    setSuccessMessage("");
    
    if (!validateEmail()) {
      return;
    }

    if (!loginSample) {
      setError("⚠️ براہ کرم پہلے اپنی آواز ریکارڈ کریں یا فائل اپ لوڈ کریں");
      setMessage("آپ نے ابھی تک کوئی آواز رجسٹر نہیں کی۔ براہ کرم پہلے رجسٹریشن کریں اور وائس نمونے دیں");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API}/auth/voice-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          audio_base64: loginSample
        })
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle different error cases
        if (res.status === 404) {
          setError("❌ آپ نے ابھی تک وائس رجسٹر نہیں کروائی");
          setMessage("⚠️ براہ کرم پہلے رجسٹریشن کریں اور وائس نمونے دیں۔ پھر وائس لاگ ان استعمال کریں");
        } 
        else if (res.status === 401) {
          setError("❌ آواز مماثل نہیں ہے");
          setMessage("🔊 آپ کی آواز ریکارڈ شدہ آواز سے مماثل نہیں ہے۔ براہ کرم دوبارہ کوشش کریں اور واضح آواز میں بولیں۔ اگر مسئلہ برقرار رہے تو مزید سیکنڈز کے لیے ریکارڈ کریں");
        }
        else {
          setError(data.detail || "لاگ ان میں خرابی");
          setMessage("⚠️ براہ کرم دوبارہ کوشش کریں یا عام لاگ ان استعمال کریں");
        }
        
        setIsLoading(false);
        return;
      }

      localStorage.setItem("token", data.access_token);
      setSuccessMessage("✅ وائس لاگ ان کامیاب! مین پیج پر جا رہے ہیں...");
      
      setTimeout(() => {
        navigate("/main");
      }, 2000);

    } catch (err) {
      setError("سرور سے رابطہ نہیں ہو سکا");
      setMessage("⚠️ براہ کرم اپنے انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4 font-urdu">
          🎤 وائس لاگ ان
        </h2>

        {/* Warning Message for No Voice Registration */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-400 rounded-lg text-right">
          <p className="text-yellow-800 text-sm font-urdu">
            ⚠️ نوٹ: اگر آپ نے پہلے وائس رجسٹر نہیں کروائی تو براہ کرم پہلے رجسٹریشن کریں اور وائس نمونے دیں
          </p>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right">
            ❌ {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right animate-pulse">
            {successMessage}
          </div>
        )}
        
        {message && !error && !successMessage && (
          <div className={`mb-3 p-3 rounded-lg text-right text-sm ${
            message.includes("🔴") 
              ? "bg-red-100 text-red-700 animate-pulse" 
              : message.includes("✅")
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-3">
          {/* Email Field */}
          <div>
            <label className="block text-gray-700 font-urdu mb-1 text-right text-sm">
              ای میل
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>

          {/* Voice Recording Section */}
          <div className="border-2 border-gray-200 rounded-xl p-3">
            <div className="space-y-2">
              {/* Recording Button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`relative w-20 h-20 rounded-full transition-all ${
                    isRecording
                      ? "bg-red-500 animate-pulse"
                      : loginSample
                      ? "bg-green-500"
                      : "bg-purple-500"
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isRecording ? (
                      <>
                        <div className="w-4 h-4 bg-white rounded-sm animate-pulse"></div>
                        <div className="absolute w-10 h-10 bg-red-400 rounded-full animate-ping opacity-75"></div>
                      </>
                    ) : loginSample ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </div>
                </button>
                <p className="mt-2 text-xs font-urdu text-gray-600">
                  {isRecording 
                    ? "🔴 ریکارڈنگ... دبائیں بند کرنے کے لیے" 
                    : loginSample 
                    ? "✅ آواز محفوظ ہے" 
                    : "🎙️ ریکارڈنگ شروع کریں"}
                </p>
              </div>

              {/* Audio Player */}
              <div>
                <label className="block text-gray-600 font-urdu text-xs mb-1 text-right">
                  سنیں
                </label>
                <audio id="audioLogin" controls className="w-full h-8 rounded-lg">
                  <source src="" type="audio/wav" />
                </audio>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-gray-600 font-urdu text-xs mb-1 text-right">
                  یا فائل اپ لوڈ کریں
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={uploadFile}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={sendLogin}
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg font-urdu text-base font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>لاگ ان ہو رہا ہے...</span>
              </>
            ) : (
              "🔓 وائس لاگ ان کریں"
            )}
          </button>

          {/* Help Text */}
          <div className="text-center text-xs text-gray-500 font-urdu">
            <p>💡提示: اپنی آواز واضح طور پر ریکارڈ کریں</p>
            <p>اگر آواز مماثل نہ ہو تو مزید سیکنڈز کے لیے ریکارڈ کریں</p>
          </div>

          {/* Back to Login Link */}
          <div className="text-center">
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-urdu text-sm">
              ← عام لاگ ان پر واپس جائیں
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceLogin;