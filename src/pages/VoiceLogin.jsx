import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
  const isAuthenticated = !!localStorage.getItem("token");

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError("ای میل درج کرنا ضروری ہے");
      return false;
    }
    if (!emailRegex.test(email)) {
      setError("درست ای میل ایڈریس درج کریں");
      return false;
    }
    return true;
  };

  async function toggleRecording() {
    if (isRecording) stopRecording();
    else await startRecording();
  }

  async function startRecording() {
    try {
      setError(""); setMessage(""); setSuccessMessage("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current);
          const wavBlob = await convertToWav(blob);
          const base64 = await blobToBase64(wavBlob);
          setLoginSample(base64);
          const audioEl = document.getElementById("audioLogin");
          if (audioEl) audioEl.src = URL.createObjectURL(wavBlob);
          setMessage("✅ آواز ریکارڈ ہو گئی۔ اب آپ لاگ ان کر سکتے ہیں");
          setIsRecording(false);
          stream.getTracks().forEach(track => track.stop());
        } catch {
          setError("ریکارڈنگ محفوظ کرنے میں دشواری پیش آئی");
          setIsRecording(false);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setMessage("🔴 آواز ریکارڈ ہو رہی ہے...");
    } catch {
      setError("مائیکروفون تک رسائی حاصل نہیں ہو سکی");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
  }

  async function uploadFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setMessage("📁 فائل اپ لوڈ کی جا رہی ہے...");
      const wavBlob = await convertToWav(file);
      const base64 = await blobToBase64(wavBlob);
      setLoginSample(base64);
      const audioEl = document.getElementById("audioLogin");
      if (audioEl) audioEl.src = URL.createObjectURL(wavBlob);
      setMessage("✅ فائل تیار ہے");
    } catch {
      setError("فائل اپ لوڈ کرنے میں مسئلہ پیش آئی");
    }
  }

  async function convertToWav(blob) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
    const writeString = (v, offset, str) => { for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i)); };
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE"); writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    writeString(view, 36, "data"); view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s * 0x7fff, true);
    }
    return buffer;
  }

  function blobToBase64(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }

  async function sendLogin() {
    if (!validateEmail()) return;
    if (!loginSample) { setError("⚠️ پہلے اپنی آواز ریکارڈ کریں"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/auth/voice-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, audio_base64: loginSample })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 404 ? "آپ کی وائس پروفائل نہیں ملی" : data.detail || "لاگ ان میں ناکامی");
        setIsLoading(false); return;
      }
      localStorage.setItem("token", data.access_token);
      setSuccessMessage("✅ وائس لاگ ان کامیاب!");
      setTimeout(() => navigate("/items"), 1500);
    } catch {
      setError("سرور سے رابطہ منقطع ہے");
    } finally { setIsLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header isAuthenticated={isAuthenticated} user={null} />

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6 font-urdu">وائس لاگ ان</h2>

          <div className="space-y-5">
            {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right font-urdu text-sm">{error}</div>}
            {successMessage && <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right font-urdu text-sm animate-pulse">{successMessage}</div>}
            {message && !error && !successMessage && <div className="p-3 bg-blue-50 border border-blue-400 text-blue-700 rounded-lg text-right font-urdu text-sm">{message}</div>}

            {/* Email Field - cursor will be on left for typing */}
            <div>
              <input
                type="email"
                placeholder="ای میل درج کریں"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right font-urdu focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-right"
                style={{ textAlign: "right" }}
              />
            </div>

           {/* Recording UI */}
<div className="bg-gray-50 rounded-xl p-5 flex flex-col items-center space-y-4 border border-gray-200">
  <div className="flex items-center">
    <span className="text-gray-700 font-urdu text-sm ml-3 pr-2">
      {isRecording ? "ریکارڈنگ ہو رہی ہے... روکنے کے لیے کلک کریں" : "ریکارڈ کرنے کے لیے کلک کریں"}
    </span>
    <button
      type="button"
      onClick={toggleRecording}
      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
        isRecording ? "bg-red-500 animate-pulse scale-110" : "bg-purple-600 hover:bg-purple-700"
      }`}
    >
      {isRecording ? <div className="w-5 h-5 bg-white rounded-sm"></div> : <span className="text-2xl text-white">🎙️</span>}
    </button>
  </div>
  
  <audio id="audioLogin" controls className="w-full h-10 rounded" />
  
  <div className="w-full">
    <input type="file" accept="audio/*" onChange={uploadFile} className="hidden" id="voice-file" />
    <label htmlFor="voice-file" className="block w-full text-center py-2 bg-white border border-gray-300 rounded-lg text-sm font-urdu text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors">
      📁 یا آواز کی فائل اپ لوڈ کریں
    </label>
  </div>
</div>

            <button
              onClick={sendLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-urdu text-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>تصدیق ہو رہی ہے...</span></> : "لاگ ان کریں"}
            </button>
          </div>
        </div>

        {/* Links Outside the Card */}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-purple-600 hover:text-purple-800 font-urdu text-sm inline-flex items-center gap-2 transition-all hover:underline underline-offset-2">
            <span>←</span> ای میل اور پاس ورڈ کے ذریعے لاگ ان کریں
          </Link>
        </div>
      </main>

      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default VoiceLogin;