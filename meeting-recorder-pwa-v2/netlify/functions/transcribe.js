// netlify/functions/transcribe.js
// Recibe audio en base64 desde el frontend y devuelve una transcripción.
// Si no hay OPENAI_API_KEY configurada en Netlify, devuelve una transcripción simulada
// en lugar de lanzar error.

function decodeBase64Audio(base64) {
  return Buffer.from(base64, "base64");
}

/**
 * Llama a la API de OpenAI Whisper (modelo whisper-1).
 * Devuelve texto de transcripción.
 */
async function transcribeWithOpenAI(audioBuffer, mimeType) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return "Transcripción simulada (no hay OPENAI_API_KEY configurada en Netlify).";
  }

  // Node 18 en Netlify ya expone fetch, FormData y Blob vía undici.
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType || "audio/webm" });
  formData.append("file", blob, "audio.webm");
  formData.append("model", "whisper-1");
  // Puedes añadir "language" si quieres forzar, p.ej. formData.append("language", "es");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenAI error:", response.status, errText);
    throw new Error("OpenAI transcription error");
  }

  const data = await response.json();
  return data.text || "";
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { audioBase64, mimeType } = body;

    if (!audioBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing audioBase64" }),
      };
    }

    const audioBuffer = decodeBase64Audio(audioBase64);
    let transcript;

    try {
      transcript = await transcribeWithOpenAI(audioBuffer, mimeType);
    } catch (openaiErr) {
      console.error("Fallo en llamada a OpenAI:", openaiErr);
      // Fallback para no romper la app.
      transcript =
        "No se ha podido transcribir con OpenAI (revisa la clave o el uso de la API).";
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ transcript }),
    };
  } catch (err) {
    console.error("Handler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error", details: String(err) }),
    };
  }
};
