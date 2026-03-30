import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

function VoiceLogin() {
  const [email, setEmail] = useState("");
  const [loginSample, setLoginSample] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const navigate = useNavigate();

  // ======================
  // START RECORD
  // ======================
  async function startRecording() {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();

      setMessage("🎙️ ریکارڈنگ شروع ہو گئی");
    } catch {
      setError("مائیکروفون تک رسائی نہیں ملی");
    }
  }

  // ======================
  // STOP RECORD
  // ======================
  function stopRecording() {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.onstop = async () => {
      try {
        const blob = new Blob(chunksRef.current);

        // 🔥 CONVERT TO WAV
        const wavBlob = await convertToWav(blob);

        const base64 = await blobToBase64(wavBlob);
        setLoginSample(base64);

        document.getElementById("audioLogin").src =
          URL.createObjectURL(wavBlob);

        setMessage("✅ ریکارڈ محفوظ ہو گیا");
      } catch (err) {
        console.error(err);
        setError("ریکارڈ محفوظ کرنے میں خرابی ہوئی");
      }
    };
  }

  // ======================
  // FILE UPLOAD
  // ======================
  async function uploadFile(e) {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // 🔥 convert ANY format → WAV
      const wavBlob = await convertToWav(file);

      const base64 = await blobToBase64(wavBlob);
      setLoginSample(base64);

      document.getElementById("audioLogin").src =
        URL.createObjectURL(wavBlob);

      setMessage("📁 فائل شامل ہو گئی");
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
  // SEND LOGIN
  // ======================
  async function sendLogin() {
    setError("");
    setMessage("");

    if (!email || !email.includes("@")) {
      setError("درست ای میل درج کریں");
      return;
    }

    if (!loginSample) {
      setError("براہ کرم ایک وائس سیمپل دیں");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/voice-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          audio_base64: loginSample
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          Array.isArray(data.detail)
            ? data.detail.map((e) => e.msg).join(", ")
            : data.detail || "لاگ ان میں خرابی"
        );
        return;
      }

      localStorage.setItem("token", data.access_token);

      setMessage("✅ وائس لاگ ان کامیاب");
      setTimeout(() => navigate("/main"), 1500);

    } catch {
      setError("سرور سے رابطہ نہیں ہو سکا");
    }
  }

  // ======================
  // UI
  // ======================
  return (
    <div className="max-w-xl mx-auto p-4">

      <h2 className="text-center text-lg font-semibold mb-3">
        🔑 وائس لاگ ان
      </h2>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {message && <p className="text-green-600 text-sm mb-2">{message}</p>}

      <input
        type="email"
        placeholder="ای میل درج کریں"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      />

      <div className="border p-3 rounded">

        <div className="grid grid-cols-2 gap-3">

          {/* LEFT */}
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="audio/*"
              onChange={uploadFile}
              className="text-xs"
            />
            <audio id="audioLogin" controls className="w-full h-7" />
          </div>

          {/* RIGHT */}
          <div className="flex flex-col justify-center gap-2 items-center">
            <button
              type="button"
              onClick={startRecording}
              className="text-blue-500"
            >
              🎙️ شروع
            </button>

            <button
              type="button"
              onClick={stopRecording}
              className="text-purple-500"
            >
              ⏹️ ختم
            </button>
          </div>

        </div>
      </div>

      <button
        onClick={sendLogin}
        className="w-full border p-2 rounded mt-3"
      >
        لاگ ان کریں
      </button>
    </div>
  );
}

export default VoiceLogin;