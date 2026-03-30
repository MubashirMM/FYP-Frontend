import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const urduSentences = [
  "میری کتاب میز پر ہے",
  "آج موسم خوشگوار ہے",
  "میں اسکول جا رہا ہوں",
  "کل ہم دوستوں کے ساتھ کھیلیں گے",
  "یہ شہر بہت خوبصورت ہے",
  "میرا نام محمد ہے",
  "میں چائے پینا پسند کرتا ہوں",
  "وہ بازار جا رہی ہے",
  "ہم کل لاہور جائیں گے",
  "یہ میرا پسندیدہ گانا ہے"
];

function VoiceSamplesForm() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || "");
  const [sentences, setSentences] = useState([]);
  const [samples, setSamples] = useState({ 1: null, 2: null, 3: null });

  const [messages, setMessages] = useState({});
  const [error, setError] = useState("");
  const [globalMessage, setGlobalMessage] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    const shuffled = [...urduSentences].sort(() => 0.5 - Math.random());
    setSentences(shuffled.slice(0, 3));
  }, []);

  // ======================
  // RECORD START
  // ======================
  async function startRecording(slot) {
    try {
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();

      setMessages((prev) => ({
        ...prev,
        [slot]: "🎙️ ریکارڈنگ شروع ہو گئی"
      }));

    } catch {
      setError("مائیکروفون تک رسائی نہیں ملی");
    }
  }

  // ======================
  // RECORD STOP
  // ======================
  function stopRecording(slot) {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.onstop = async () => {
      try {
        const blob = new Blob(chunksRef.current);

        // 🔥 convert ANY format → WAV
        const wavBlob = await convertToWav(blob);

        const base64 = await blobToBase64(wavBlob);

        setSamples((prev) => ({ ...prev, [slot]: base64 }));

        const audioEl = document.getElementById(`audio${slot}`);
        if (audioEl) audioEl.src = URL.createObjectURL(wavBlob);

        setMessages((prev) => ({
          ...prev,
          [slot]: "✅ ریکارڈ محفوظ ہو گیا"
        }));

      } catch (err) {
        console.error(err);
        setError("ریکارڈ محفوظ کرنے میں خرابی ہوئی");
      }
    };
  }

  // ======================
  // FILE UPLOAD (ANY FORMAT)
  // ======================
  async function uploadFile(e, slot) {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // 🔥 convert ANY format → WAV
      const wavBlob = await convertToWav(file);

      const base64 = await blobToBase64(wavBlob);

      setSamples((prev) => ({ ...prev, [slot]: base64 }));

      const audioEl = document.getElementById(`audio${slot}`);
      if (audioEl) audioEl.src = URL.createObjectURL(wavBlob);

      setMessages((prev) => ({
        ...prev,
        [slot]: "📁 فائل شامل ہو گئی"
      }));

    } catch (err) {
      console.error(err);
      setError("فائل اپ لوڈ میں خرابی ہوئی");
    }
  }

  // ======================
  // CONVERT TO WAV (KEY FIX)
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
  // SEND
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

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/save-voice-samples", {
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
        return;
      }

      setGlobalMessage("✅ وائس سیمپلز محفوظ ہو گئے");
      setTimeout(() => navigate("/login"), 2000);

    } catch {
      setError("سرور سے رابطہ نہیں ہو سکا");
    }
  }

  // ======================
  // UI
  // ======================
  return (
    <div className="max-w-2xl mx-auto p-3">

      <h2 className="text-center text-lg font-semibold mb-3">
        🎤 وائس شامل کریں
      </h2>

      <input
        type="email"
        placeholder="ای میل درج کریں"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2 mb-2 rounded"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {globalMessage && <p className="text-green-600 text-sm">{globalMessage}</p>}

      {sentences.map((sentence, index) => {
        const slot = index + 1;

        return (
          <div key={slot} className="border p-2 mb-3 rounded">

            {/* MESSAGE ABOVE */}
            {messages[slot] && (
              <p className="text-green-600 text-xs mb-1">
                {messages[slot]}
              </p>
            )}

            <p className="text-sm mb-2 text-center">{sentence}</p>

            <div className="grid grid-cols-2 gap-3">

              {/* LEFT */}
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => uploadFile(e, slot)}
                  className="text-xs"
                />
                <audio id={`audio${slot}`} controls className="w-full h-7" />
              </div>

              {/* RIGHT */}
              <div className="flex flex-col justify-center gap-2 items-center">
                <button
                  type="button"
                  onClick={() => startRecording(slot)}
                  className="text-blue-500 text-sm"
                >
                  🎙️ شروع
                </button>

                <button
                  type="button"
                  onClick={() => stopRecording(slot)}
                  className="text-purple-500 text-sm"
                >
                  ⏹️ ختم
                </button>
              </div>

            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={sendSamples}
        className="w-full border p-2 rounded mt-2"
      >
        محفوظ کریں
      </button>

      <p
        onClick={() => navigate("/login")}
        className="text-center text-purple-500 mt-2 cursor-pointer"
      >
        کینسل کریں
      </p>
    </div>
  );
}

export default VoiceSamplesForm;