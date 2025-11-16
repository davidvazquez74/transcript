// netlify/functions/transcribe.js
// Recibe audio en base64 desde el frontend y devuelve una transcripción.
// Si no hay OPENAI_API_KEY configurada en Netlify, devuelve un texto stub.

const crypto = require("crypto");

function decodeBase64Audio(base64) {
  return Buffer.from(base64, "base64");
}

/**
 * Llama a la API de OpenAI Whisper (si hay API key).
 * Devuelve texto de transcripción.
 */
async function transcribeWithOpenAI(audioBuffer, mimeType) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return "Transcripción simulada (no hay OPENAI_API_KEY configurada en Netlify).";
  }

  // Usamos fetch directamente contra la API de OpenAI (audio transcriptions).
  const formDataBoundary = "----WebKitFormBoundary" + crypto.randomBytes(16).toString("hex");
  const boundary = formDataBoundary;

  const bodyParts = [];

  function addField(name, value) {
    bodyParts.push(`--${boundary}\r\n`);
    bodyParts.push(`Content-Disposition: form-data; name="${name}"\r\n\r\n`);
    bodyParts.push(value + "\r\n");
  }

  function addFile(name, filename, contentType, buffer) {
    bodyParts.push(`--${boundary}\r\n`);
    bodyParts.push(
      `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`
    );
    bodyParts.push(`Content-Type: ${contentType}\r\n\r\n`);
    bodyParts.push(buffer);
    bodyParts.push("\r\n");
  }

  addField("model", "gpt-4o-transcribe"); // ajusta al modelo que tengas disponible
  addFile("file", "audio.webm", mimeType || "audio/webm", audioBuffer);
  bodyParts.push(`--${boundary}--\r\n`);

  const bodyBuffer = Buffer.concat(
    bodyParts.map((part) => (typeof part === "string" ? Buffer.from(part, "utf8") : part))
  );

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: bodyBuffer,
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
    const transcript = await transcribeWithOpenAI(audioBuffer, mimeType);

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
