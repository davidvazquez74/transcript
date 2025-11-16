# Grabación de Reuniones (PWA + Netlify) – v2

Esta versión corrige la función `transcribe` para llamar a la API de OpenAI usando
el modelo `whisper-1` con `FormData`, que es compatible con el runtime de Netlify (Node 18).

## Resumen

- Frontend:
  - Graba audio con `getUserMedia` + `MediaRecorder`.
  - Envía el audio en base64 a `/.netlify/functions/transcribe`.
  - Muestra y guarda la transcripción en `localStorage`.

- Backend (Netlify Function `transcribe.js`):
  - Si NO hay `OPENAI_API_KEY`:
    - Devuelve una transcripción simulada para no romper el flujo.
  - Si SÍ hay `OPENAI_API_KEY`:
    - Llama a `https://api.openai.com/v1/audio/transcriptions` con:
      - `model: whisper-1`
      - archivo `audio.webm` generado a partir del buffer.
    - Devuelve `data.text` como `transcript`.

## Pasos para desplegar

1. Subir este ZIP a un repo GitHub (todo en la raíz).
2. Crear sitio en Netlify desde Git:
   - Build command: vacío.
   - Publish directory: `.`.
3. En Netlify → Site settings → Environment variables:
   - Añadir `OPENAI_API_KEY` con tu clave de OpenAI.
4. Trigger deploy.
5. Abrir la URL en Safari (iPhone), aceptar permiso de micrófono y probar grabación.

