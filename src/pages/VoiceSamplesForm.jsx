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
          setMessages((prev) => ({ ...prev, [slot]: "✅ ریکارڈ محفوظ" }));
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
      setMessages((prev) => ({ ...prev, [slot]: "🔴 ریکارڈنگ جاری ہے..." }));
    } catch {
      setError("مائیکروفون تک رسائی نہیں ملی");
    }
  }

  function stopRecording(slot) {
    if (mediaRecorderRef.current && recordingStatus[slot]) {
      mediaRecorderRef.current.stop();
      setMessages((prev) => ({ ...prev, [slot]: "⏹️ ریکارڈنگ بند" }));
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
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header isAuthenticated={isAuthenticated} user={null} onLogout={handleLogout} />

      <main className="flex-1 py-4 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-5">
            <h2 className="text-xl font-bold text-center text-gray-800 mb-2 font-urdu">
              🎤 وائس نمونے شامل کریں
            </h2>

            {/* Instructions Box */}


            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm font-urdu font-bold mb-2">📋 ہدایات:</p>
              <ul className="text-blue-700 text-xs font-urdu space-y-1 pr-4">
                <li>• 🎙️ ریکارڈ بٹن دبائیں اور کوئی بھی جملہ بولیں (یا دیا گیا جملہ پڑھیں)</li>
                <li>• ⏹️ ریکارڈنگ بند کرنے کے لیے دوبارہ بٹن دبائیں</li>
                <li>• 📁 آپ پہلے سے ریکارڈ شدہ فائل بھی اپ لوڈ کر سکتے ہیں</li>
                <li>• ⏱️ کم از کم 6-8 سیکنڈز تک ریکارڈ کریں تاکہ آواز اچھی طرح کیپچر ہو</li>
                <li>• 🔇 خاموش ماحول میں ریکارڈ کریں</li>
              </ul>
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <input
                type="email"
                placeholder="براہ کرم اپنا ای میل درج کریں"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 text-sm"
              />
             
            </div>

            {error && (
              <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right text-sm font-urdu">
                ❌ {error}
              </div>
            )}

            {globalMessage && (
              <div className="mb-3 p-2 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right animate-pulse text-sm font-urdu">
                ✅ {globalMessage}
                <p className="text-xs mt-1">لاگ ان پیج پر جا رہے ہیں...</p>
              </div>
            )}

            {/* Sentences Cards */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {sentences.map((sentence, index) => {
                const slot = index + 1;
                const isRecording = recordingStatus[slot];
                const hasSample = samples[slot];

                return (
                  <div key={slot} className="border-2 border-gray-200 rounded-xl p-3 hover:border-purple-300 transition-all">
                    {messages[slot] && (
                      <div className={`mb-2 p-1 rounded-lg text-center text-xs font-urdu ${messages[slot].includes("✅") ? "bg-green-100 text-green-700"
                          : messages[slot].includes("🔴") ? "bg-red-100 text-red-700 animate-pulse"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                        {messages[slot]}
                      </div>
                    )}

                    <p className="text-sm font-urdu text-gray-800 mb-3 text-center bg-gray-50 p-2 rounded-lg">
                      {sentence}
                    </p>

                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 space-y-2">
                        <div>
                          <p className="text-gray-600 font-urdu text-xs mb-1 text-right">📁 فائل منتخب کریں</p>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => uploadFile(e, slot)}
                            className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                          />
                        </div>

                        <div>
                          <p className="text-gray-600 font-urdu text-xs mb-1 text-right">🔊 سنیں</p>
                          <audio id={`audio${slot}`} controls className="w-full h-8 rounded-lg">
                            <source src="" type="audio/wav" />
                          </audio>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <button
                          type="button"
                          onClick={() => toggleRecording(slot)}
                          className={`relative w-20 h-20 rounded-full transition-all transform hover:scale-105 focus:outline-none focus:ring-4 ${isRecording ? "bg-red-500 shadow-lg shadow-red-300 animate-pulse"
                              : hasSample ? "bg-green-500 shadow-lg shadow-green-300"
                                : "bg-purple-500 shadow-lg shadow-purple-300"
                            }`}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isRecording ? (
                              <>
                                <div className="w-5 h-5 bg-white rounded-sm animate-pulse"></div>
                                <div className="absolute w-12 h-12 bg-red-400 rounded-full animate-ping opacity-75"></div>
                              </>
                            ) : hasSample ? (
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
                          {isRecording ? "🔴 ریکارڈنگ جاری ہے... دبائیں بند کرنے کے لیے"
                            : hasSample ? "✅ آواز محفوظ ہے"
                              : "🎙️ ریکارڈنگ شروع کریں"}
                        </p>
                      </div>
                    </div>

                    {hasSample && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-0.5">
                        <div className="bg-green-500 h-0.5 rounded-full w-full"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Notes Section */}
            <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-xs font-urdu text-center">
                💡 نوٹ: بہتر نتائج کے لیے کم از کم 6-8 سیکنڈز تک ریکارڈ کریں اور خاموش ماحول میں بولیں
              </p>
            </div>

            <button
              type="button"
              onClick={sendSamples}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-urdu text-base font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-md"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>محفوظ ہو رہا ہے...</span>
                </>
              ) : (
                "✅ وائس نمونے محفوظ کریں"
              )}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full mt-2 text-gray-600 hover:text-purple-600 font-urdu text-sm py-1 transition-colors"
            >
              منسوخ کریں
            </button>
          </div>
        </div>
      </main>

      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default VoiceSamplesForm;