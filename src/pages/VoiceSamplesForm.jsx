import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const urduSentences = [
  "اسٹور میں 20 کلو چاول شامل کرو، فی کلو قیمت 500 روپے ہے",
  "گودام میں 50 کلو آٹا ڈال دو، فی کلو قیمت 120 روپے ہے",
  "اسٹور میں 100 کلو چینی شامل کرو، فی کلو قیمت 150 روپے",
  "گودام میں 10 بوری کھاد ڈال دو، فی بوری قیمت 2500 روپے",
  "اسٹور میں 25 کلو نمک رکھ دو، فی کلو قیمت 60 روپے ہے",
  "گودام میں 200 لیٹر دودھ ڈال دو، فی لیٹر قیمت 180 روپے",
  "اسٹور میں 30 لیٹر تیل شامل کرو، فی لیٹر قیمت 400 روپے",
  "گودام میں 15 بوری چاول ڈال دو، فی بوری قیمت 5000 روپے",
  "اسٹور میں 40 کلو دال مسور رکھ دو، فی کلو قیمت 280 روپے",
  "گودام میں 5 من گندم ڈال دو، فی من قیمت 1200 روپے",
  "جانم علی کے کھاتے میں 1 من گندم ڈال دو",
  "احمد کے کھاتے میں 2 بوری چاول ڈال دو",
  "سلیم کے کھاتے میں 50 کلو آٹا ڈال دو",
  "رابعہ کے کھاتے میں 10 لیٹر تیل ڈال دو",
  "فاطمہ کے کھاتے میں 5 درجن انڈے ڈال دو",
  "عمر کے کھاتے میں 3 من چاول ڈال دو",
  "زینب کے کھاتے میں 20 کلو دال ڈال دو",
  "علی کے کھاتے میں 100 کلو چینی ڈال دو",
  "نسیم کے کھاتے میں 2 من آٹا ڈال دو",
  "خالد کے کھاتے میں 30 کلو چاول ڈال دو",
  "شازیہ کے کھاتے میں 4 بوری گندم ڈال دو",
  "اقبال کے کھاتے میں 15 لیٹر دودھ ڈال دو",
  "ناصر کے کھاتے میں 8 درجن انڈے ڈال دو",
  "علی کے کھاتے سے 20 کلو چینی نکال دو",
  "جانم علی کے کھاتے سے 10 کلو گندم ہٹا دو",
  "احمد کے کھاتے سے 1 بوری چاول کم کرو",
  "سلیم کے کھاتے سے 15 کلو آٹا نکال دو",
  "رابعہ کے کھاتے سے 3 لیٹر تیل ہٹا دو",
  "فاطمہ کے کھاتے سے 2 درجن انڈے نکال دو",
  "عمر کے کھاتے سے 1 من چاول کم کرو",
  "زینب کے کھاتے سے 5 کلو دال ہٹا دو",
];

function VoiceSamplesForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const [email, setEmail] = useState(location.state?.email || "");
  const [sentences, setSentences] = useState([]);
  const [samples, setSamples] = useState({ 1: null, 2: null, 3: null });
  const [recordingStatus, setRecordingStatus] = useState({ 1: false, 2: false, 3: false });
  const [messages, setMessages] = useState({});
  const [error, setError] = useState("");
  const [globalMessage, setGlobalMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const isAuthenticated = !!localStorage.getItem("token");

  useEffect(() => {
    const shuffled = [...urduSentences].sort(() => 0.5 - Math.random());
    setSentences(shuffled.slice(0, 3));
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  async function toggleRecording(slot) {
    if (recordingStatus[slot]) {
      stopRecording(slot);
    } else {
      await startRecording(slot);
    }
  }

  async function startRecording(slot) {
    try {
      setError("");
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
          setSamples((prev) => ({ ...prev, [slot]: base64 }));
          const audioEl = document.getElementById(`audio${slot}`);
          if (audioEl) audioEl.src = URL.createObjectURL(wavBlob);
          setMessages((prev) => ({ ...prev, [slot]: "✅ آواز محفوظ ہو گئی" }));
          setRecordingStatus((prev) => ({ ...prev, [slot]: false }));
          setTimeout(() => setMessages((prev) => ({ ...prev, [slot]: "" })), 2000);
          if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        } catch (err) {
          console.error(err);
          setError("ریکارڈ محفوظ کرنے میں خرابی");
          setRecordingStatus((prev) => ({ ...prev, [slot]: false }));
        }
      };

      mediaRecorderRef.current.start();
      setRecordingStatus((prev) => ({ ...prev, [slot]: true }));
      setMessages((prev) => ({ ...prev, [slot]: "🔴 ریکارڈنگ ہو رہی ہے..." }));
    } catch {
      setError("مائیکروفون تک رسائی نہیں ملی");
    }
  }

  function stopRecording(slot) {
    if (mediaRecorderRef.current && recordingStatus[slot]) {
      mediaRecorderRef.current.stop();
    }
  }

  async function uploadFile(e, slot) {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setMessages((prev) => ({ ...prev, [slot]: "📁 پروسیسنگ..." }));
      const wavBlob = await convertToWav(file);
      const base64 = await blobToBase64(wavBlob);
      setSamples((prev) => ({ ...prev, [slot]: base64 }));
      const audioEl = document.getElementById(`audio${slot}`);
      if (audioEl) audioEl.src = URL.createObjectURL(wavBlob);
      setMessages((prev) => ({ ...prev, [slot]: "✅ فائل شامل" }));
      setTimeout(() => setMessages((prev) => ({ ...prev, [slot]: "" })), 2000);
    } catch (err) {
      console.error(err);
      setError("فائل اپ لوڈ میں خرابی");
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
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function sendSamples() {
    setError("");
    setGlobalMessage("");
    if (!email || !email.includes("@")) {
      setError("براہ کرم اپنا ای میل درج کریں");
      return;
    }
    if (!samples[1] || !samples[2] || !samples[3]) {
      setError("براہ کرم تینوں سیمپلز مکمل کریں");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/auth/save-voice-samples`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, samples: [samples[1], samples[2], samples[3]] })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(Array.isArray(data.detail) ? data.detail.map(e => e.msg).join(", ") : data.detail || "خرابی ہوئی");
        setIsLoading(false);
        return;
      }
      setGlobalMessage("✅ وائس سیمپلز کامیابی سے محفوظ ہو گئے!");
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      setError("سرور سے رابطہ نہیں ہو سکا");
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      <Header isAuthenticated={isAuthenticated} user={null} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-lg">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-6 font-urdu">
            🎤 وائس نمونے شامل کریں
          </h2>

          {/* Instructions Box */}
          <div className="mb-5 p-3 bg-blue-50 border-r-4 border-blue-500 rounded-lg">
            <p className="text-blue-800 text-sm font-urdu font-bold mb-2">📋 ہدایات:</p>
            <ul className="text-blue-700 text-xs font-urdu space-y-1 pr-4">
              <li>• 🎙️ ریکارڈ بٹن دبائیں اور دیا گیا جملہ پڑھیں</li>
              <li>• ⏹️ ریکارڈنگ بند کرنے کے لیے دوبارہ بٹن دبائیں</li>
              <li>• 📁 آپ پہلے سے ریکارڈ شدہ فائل بھی اپ لوڈ کر سکتے ہیں</li>
              <li>• ⏱️ کم از کم 6-8 سیکنڈز تک ریکارڈ کریں</li>
            </ul>
          </div>

          {/* Email Input - Styled like VoiceLogin */}
          <div className="mb-4">
            <input
              type="email"
              placeholder="براہ کرم اپنا ای میل درج کریں"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right font-urdu focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-gray-400"
              style={{ textAlign: "right" }}
            />
          </div>

          {/* Error / Global Messages */}
          {error && (
            <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right font-urdu text-sm">
              ❌ {error}
            </div>
          )}
          {globalMessage && (
            <div className="mb-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right font-urdu text-sm animate-pulse">
              ✅ {globalMessage}
            </div>
          )}

          {/* Scrollable Voice Cards - One visible at a time */}
          <div className="snap-y snap-mandatory overflow-y-auto h-[380px] pr-1 space-y-4 mb-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sentences.map((sentence, index) => {
              const slot = index + 1;
              const isRecording = recordingStatus[slot];
              const hasSample = samples[slot];

              return (
                <div key={slot} className="snap-start shrink-0 bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col items-center space-y-4">
                  {/* Sentence Text */}
                  <p className="text-base md:text-lg font-urdu text-gray-800 w-full text-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    {sentence}
                  </p>

                  {/* Status Message */}
                  {messages[slot] && (
                    <div className={`p-2 rounded-lg text-center text-xs font-urdu w-full ${
                      messages[slot].includes("✅") ? "bg-green-100 text-green-700"
                      : messages[slot].includes("🔴") ? "bg-red-100 text-red-700 animate-pulse"
                      : "bg-blue-100 text-blue-700"
                    }`}>
                      {messages[slot]}
                    </div>
                  )}

                  {/* Recording UI Block (Matches VoiceLogin) */}
                  <div className="w-full bg-white rounded-lg p-4 border border-gray-200 flex flex-col items-center space-y-3">
                    <div className="flex items-center justify-center w-full gap-3">
                      <span className="text-gray-700 font-urdu text-sm">
                        {isRecording ? "ریکارڈنگ ہو رہی ہے... روکنے کے لیے کلک کریں" : "ریکارڈ کرنے کے لیے کلک کریں"}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleRecording(slot)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
                          isRecording ? "bg-red-500 animate-pulse scale-110" : hasSample ? "bg-green-500" : "bg-purple-600 hover:bg-purple-700"
                        }`}
                      >
                        {isRecording ? (
                          <div className="w-4 h-4 bg-white rounded-sm"></div>
                        ) : (
                          <span className="text-xl text-white">🎙️</span>
                        )}
                      </button>
                    </div>

                    {/* Audio Player */}
                    <audio id={`audio${slot}`} controls className="w-full h-10 rounded" />

                    {/* File Upload */}
                    <div className="w-full">
                      <input type="file" accept="audio/*" onChange={(e) => uploadFile(e, slot)} className="hidden" id={`file-${slot}`} />
                      <label 
                        htmlFor={`file-${slot}`}
                        className="block w-full text-center py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-urdu text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        📁 یا آواز کی فائل اپ لوڈ کریں
                      </label>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {hasSample && (
                    <div className="w-full bg-green-100 rounded-full h-1.5 mt-1">
                      <div className="bg-green-500 h-1.5 rounded-full w-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Note */}
          <div className="mb-4 p-2 bg-yellow-50 border-r-4 border-yellow-500 rounded-lg">
            <p className="text-yellow-700 text-xs font-urdu text-center">
              💡 نوٹ: بہتر نتائج کے لیے کم از کم 6-8 سیکنڈز تک ریکارڈ کریں اور خاموش ماحول میں بولیں
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={sendSamples}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-urdu text-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>محفوظ ہو رہا ہے...</span>
              </>
            ) : (
              "✅ وائس نمونے محفوظ کریں"
            )}
          </button>

          {/* Cancel Link */}
          <div className="text-center mt-4">
            <button
              onClick={() => navigate("/login")}
              className="text-gray-500 hover:text-purple-600 font-urdu text-sm inline-flex items-center gap-2 transition-all hover:underline underline-offset-2"
            >
              <span>←</span> منسوخ کریں
            </button>
          </div>
        </div>
      </main>

      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default VoiceSamplesForm;