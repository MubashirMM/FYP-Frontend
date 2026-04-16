import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

 const urduSentences = [
  // Stock additions to store/godown (with prices)
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
  
  // Customer accounts (udhaar additions - NO prices mentioned)
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
  
  // Removal from customer accounts (delete items)
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

  useEffect(() => {
    const shuffled = [...urduSentences].sort(() => 0.5 - Math.random());
    setSentences(shuffled.slice(0, 3));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ======================
  // TOGGLE RECORDING
  // ======================
  async function toggleRecording(slot) {
    if (recordingStatus[slot]) {
      // Stop recording
      stopRecording(slot);
    } else {
      // Start recording
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

          setMessages((prev) => ({
            ...prev,
            [slot]: "✅ ریکارڈ محفوظ ہو گیا"
          }));

          setRecordingStatus((prev) => ({ ...prev, [slot]: false }));

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }

        } catch (err) {
          console.error(err);
          setError("ریکارڈ محفوظ کرنے میں خرابی ہوئی");
          setRecordingStatus((prev) => ({ ...prev, [slot]: false }));
        }
      };

      mediaRecorderRef.current.start();

      setRecordingStatus((prev) => ({ ...prev, [slot]: true }));
      setMessages((prev) => ({
        ...prev,
        [slot]: "🔴 ریکارڈنگ جاری ہے..."
      }));

    } catch {
      setError("مائیکروفون تک رسائی نہیں ملی");
    }
  }

  function stopRecording(slot) {
    if (mediaRecorderRef.current && recordingStatus[slot]) {
      mediaRecorderRef.current.stop();
      setMessages((prev) => ({
        ...prev,
        [slot]: "⏹️ ریکارڈنگ بند کر رہے ہیں..."
      }));
    }
  }

  // ======================
  // FILE UPLOAD
  // ======================
  async function uploadFile(e, slot) {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setMessages((prev) => ({
        ...prev,
        [slot]: "📁 فائل پروسیس ہو رہی ہے..."
      }));

      const wavBlob = await convertToWav(file);
      const base64 = await blobToBase64(wavBlob);

      setSamples((prev) => ({ ...prev, [slot]: base64 }));

      const audioEl = document.getElementById(`audio${slot}`);
      if (audioEl) audioEl.src = URL.createObjectURL(wavBlob);

      setMessages((prev) => ({
        ...prev,
        [slot]: "✅ فائل شامل ہو گئی"
      }));

      setTimeout(() => {
        setMessages((prev) => ({ ...prev, [slot]: "" }));
      }, 3000);

    } catch (err) {
      console.error(err);
      setError("فائل اپ لوڈ میں خرابی ہوئی");
    }
  }

  // ======================
  // CONVERT TO WAV
  // ======================
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

  // ======================
  // SEND SAMPLES
  // ======================
  async function sendSamples() {
    setError("");
    setGlobalMessage("");

    if (!email || !email.includes("@")) {
      setError("درست ای میل درج کریں");
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
        body: JSON.stringify({
          email,
          samples: [samples[1], samples[2], samples[3]]
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(Array.isArray(data.detail)
          ? data.detail.map(e => e.msg).join(", ")
          : data.detail || "خرابی ہوئی"
        );
        setIsLoading(false);
        return;
      }

      setGlobalMessage("✅ وائس سیمپلز کامیابی سے محفوظ ہو گئے!");
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch {
      setError("سرور سے رابطہ نہیں ہو سکا");
    } finally {
      setIsLoading(false);
    }
  }

  // ======================
  // UI
  // ======================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6 font-urdu">
            🎤 وائس نمونے شامل کریں
          </h2>

          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-gray-700 font-urdu mb-2 text-right">
              ای میل
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right">
              ❌ {error}
            </div>
          )}

          {/* Success Message */}
          {globalMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right animate-pulse">
              ✅ {globalMessage}
              <p className="text-sm mt-1">لاگ ان پیج پر جا رہے ہیں...</p>
            </div>
          )}

          {/* Sentences Cards */}
          {sentences.map((sentence, index) => {
            const slot = index + 1;
            const isRecording = recordingStatus[slot];
            const hasSample = samples[slot];

            return (
              <div key={slot} className="mb-6 border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-all">
                {/* Status Message */}
                {messages[slot] && (
                  <div className={`mb-3 p-2 rounded-lg text-center text-sm font-urdu ${
                    messages[slot].includes("✅") 
                      ? "bg-green-100 text-green-700" 
                      : messages[slot].includes("🔴")
                      ? "bg-red-100 text-red-700 animate-pulse"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {messages[slot]}
                  </div>
                )}

                {/* Sentence */}
                <p className="text-lg font-urdu text-gray-800 mb-4 text-center bg-gray-50 p-3 rounded-lg">
                  {sentence}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column - File Upload & Audio */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-600 font-urdu text-sm mb-2 text-right">
                        فائل اپ لوڈ کریں
                      </label>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => uploadFile(e, slot)}
                        className="w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-600 font-urdu text-sm mb-2 text-right">
                        سنیں
                      </label>
                      <audio id={`audio${slot}`} controls className="w-full h-10 rounded-lg">
                        <source src="" type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>

                  {/* Right Column - Recording Button */}
                  <div className="flex flex-col items-center justify-center">
                    <button
                      type="button"
                      onClick={() => toggleRecording(slot)}
                      className={`relative w-32 h-32 rounded-full transition-all transform hover:scale-105 focus:outline-none focus:ring-4 ${
                        isRecording
                          ? "bg-red-500 shadow-lg shadow-red-300 animate-pulse"
                          : hasSample
                          ? "bg-green-500 shadow-lg shadow-green-300"
                          : "bg-purple-500 shadow-lg shadow-purple-300"
                      }`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isRecording ? (
                          <>
                            <div className="w-8 h-8 bg-white rounded-sm animate-pulse"></div>
                            <div className="absolute w-16 h-16 bg-red-400 rounded-full animate-ping opacity-75"></div>
                          </>
                        ) : hasSample ? (
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        )}
                      </div>
                    </button>
                    <p className="mt-3 text-sm font-urdu text-gray-600">
                      {isRecording 
                        ? "🔴 ریکارڈنگ... دبائیں بند کرنے کے لیے" 
                        : hasSample 
                        ? "✅ ریکارڈ محفوظ ہے" 
                        : "🎙️ ریکارڈنگ شروع کریں"}
                    </p>
                  </div>
                </div>

                {/* Progress Indicator */}
                {hasSample && (
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
                    <div className="bg-green-500 h-1 rounded-full w-full"></div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Button */}
          <button
            type="button"
            onClick={sendSamples}
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-urdu text-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
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

          {/* Cancel Button */}
          <button
            onClick={() => navigate("/login")}
            className="w-full mt-3 text-gray-600 hover:text-purple-600 font-urdu py-2 transition-colors"
          >
            منسوخ کریں
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceSamplesForm;