let mediaRecorder = null;
let chunks = [];
let recording = false;
let startTime = null;
let timerInterval = null;

const timerEl = document.getElementById("timer");
const recordBtn = document.getElementById("record-btn");
const recordBtnLabel = document.getElementById("record-btn-label");
const statusEl = document.getElementById("status");
const historyBtn = document.getElementById("history-btn");
const historyCard = document.getElementById("history-card");
const historyList = document.getElementById("history-list");
const closeHistoryBtn = document.getElementById("close-history");

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timerEl.textContent = formatTime(elapsed);
  }, 500);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      stopTimer();
      timerEl.textContent = "00:00";
      statusEl.textContent = "Procesando audio...";
      const blob = new Blob(chunks, { type: "audio/webm" });

      try {
        const transcript = await sendToTranscription(blob);
        saveToHistory(transcript);
        statusEl.textContent = "Transcripción guardada en el historial.";
      } catch (err) {
        console.error(err);
        statusEl.textContent = "Error al transcribir. Revisa el backend o la configuración.";
      }

      // detener todas las pistas de audio
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorder.start();
    startTimer();
    recording = true;
    recordBtn.classList.add("recording");
    recordBtnLabel.textContent = "Detener Grabación";
    statusEl.textContent = "Grabando... Habla cerca del micrófono.";
  } catch (err) {
    console.error("Error al iniciar la grabación:", err);
    statusEl.textContent = "No se pudo acceder al micrófono. Revisa permisos.";
  }
}

function stopRecording() {
  if (mediaRecorder && recording) {
    mediaRecorder.stop();
    recording = false;
    recordBtn.classList.remove("recording");
    recordBtnLabel.textContent = "Iniciar Grabación";
  }
}

recordBtn.addEventListener("click", () => {
  if (!recording) {
    startRecording();
  } else {
    stopRecording();
  }
});

historyBtn.addEventListener("click", () => {
  renderHistory();
  historyCard.hidden = false;
});

closeHistoryBtn.addEventListener("click", () => {
  historyCard.hidden = true;
});

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function sendToTranscription(blob) {
  const base64 = await blobToBase64(blob);

  const payload = {
    audioBase64: base64,
    mimeType: blob.type || "audio/webm",
    createdAt: new Date().toISOString(),
  };

  const res = await fetch("/.netlify/functions/transcribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error("Transcription API error: " + res.status + " " + text);
  }

  const data = await res.json();
  return data.transcript || "(Sin transcripción o backend en modo stub)";
}

function loadHistory() {
  try {
    const raw = localStorage.getItem("meetingHistory");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error loading history", err);
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem("meetingHistory", JSON.stringify(history));
}

function saveToHistory(transcript) {
  const history = loadHistory();
  const entry = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    transcript: transcript,
  };
  history.unshift(entry);
  saveHistory(history);
  renderHistory();
}

function renderHistory() {
  const history = loadHistory();
  historyList.innerHTML = "";

  if (history.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No hay grabaciones todavía.";
    li.className = "history-item";
    historyList.appendChild(li);
    return;
  }

  history.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const title = document.createElement("div");
    title.className = "history-item-title";
    title.textContent = "Grabación " + new Date(item.createdAt).toLocaleString();

    const meta = document.createElement("div");
    meta.className = "history-item-meta";
    meta.textContent = "ID: " + item.id;

    const transcript = document.createElement("div");
    transcript.className = "history-item-transcript";
    transcript.textContent = item.transcript;

    li.appendChild(title);
    li.appendChild(meta);
    li.appendChild(transcript);
    historyList.appendChild(li);
  });
}

// Inicializar historial al cargar
renderHistory();
