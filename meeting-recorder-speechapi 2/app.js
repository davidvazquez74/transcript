// Versión sin OpenAI ni backend.
// Usa la Web Speech API (webkitSpeechRecognition / SpeechRecognition) para transcribir.
// OJO: solo funciona si el navegador soporta esta API (en muchos iPhone con Safari sí, en otros no).

let recognition = null;
let recognizing = false;
let accumulatedTranscript = "";
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
  timerEl.textContent = "00:00";
}

function initRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    statusEl.textContent =
      "El navegador no soporta reconocimiento de voz (SpeechRecognition).";
    return null;
  }

  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "es-ES"; // puedes cambiar a "ca-ES", "en-US", etc.

  rec.onstart = () => {
    accumulatedTranscript = "";
    statusEl.textContent = "Escuchando... Habla cerca del micrófono.";
  };

  rec.onerror = (event) => {
    console.error("SpeechRecognition error", event);
    statusEl.textContent = "Error en reconocimiento de voz: " + (event.error || "");
  };

  rec.onend = () => {
    recognizing = false;
    recordBtn.classList.remove("recording");
    recordBtnLabel.textContent = "Iniciar Grabación";
    stopTimer();

    if (accumulatedTranscript.trim()) {
      saveToHistory(accumulatedTranscript.trim());
      statusEl.textContent = "Transcripción guardada en el historial.";
    } else {
      statusEl.textContent = "No se ha detectado voz.";
    }
  };

  rec.onresult = (event) => {
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const res = event.results[i];
      if (res.isFinal) {
        finalText += res[0].transcript;
      }
    }
    if (finalText) {
      accumulatedTranscript += (accumulatedTranscript ? " " : "") + finalText;
    }
  };

  return rec;
}

async function startRecording() {
  if (!recognition) {
    recognition = initRecognition();
    if (!recognition) return;
  }
  try {
    recognition.start();
    recognizing = true;
    recordBtn.classList.add("recording");
    recordBtnLabel.textContent = "Detener Grabación";
    startTimer();
  } catch (err) {
    console.error("Error al iniciar reconocimiento:", err);
    statusEl.textContent =
      "No se pudo iniciar el reconocimiento. ¿Ya está en marcha?";
  }
}

function stopRecording() {
  if (recognition && recognizing) {
    recognition.stop();
  }
}

recordBtn.addEventListener("click", () => {
  if (!recognizing) {
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

function loadHistory() {
  try {
    const raw = localStorage.getItem("meetingHistorySpeechAPI");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error loading history", err);
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem("meetingHistorySpeechAPI", JSON.stringify(history));
}

function saveToHistory(transcript) {
  const history = loadHistory();
  const entry = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    transcript,
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
    title.textContent =
      "Grabación " + new Date(item.createdAt).toLocaleString();

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

// Mensaje inicial
statusEl.textContent =
  "Esta versión usa la API de reconocimiento del navegador (sin OpenAI).";
