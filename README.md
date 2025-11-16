# Grabación de Reuniones (PWA + Netlify)

App web pensada para usarse desde iPhone (Safari, añadible a pantalla de inicio) que:

- Graba audio usando el micrófono del dispositivo.
- Envía el audio a una función serverless en Netlify.
- Recibe y guarda la transcripción en el historial local (localStorage).

## Estructura

- `index.html` – Pantalla principal con:
  - Título "Grabación de Reuniones".
  - Botón "Iniciar Grabación" / "Detener Grabación".
  - Temporizador.
  - Botón "Ver Historial".

- `style.css` – Estilos oscuros similares al mockup.
- `app.js` – Lógica:
  - Uso de `getUserMedia` + `MediaRecorder` para grabar audio.
  - Envío de audio en base64 a `/.netlify/functions/transcribe`.
  - Guardado del resultado en `localStorage` y visualización en el historial.

- `netlify.toml` – Config para Netlify (publish en raíz y funciones en `netlify/functions`).
- `netlify/functions/transcribe.js` – Función serverless:
  - Recibe `{ audioBase64, mimeType }`.
  - Si hay `OPENAI_API_KEY` en Netlify → llama a la API de OpenAI (Whisper) y devuelve la transcripción.
  - Si no hay API key → devuelve una transcripción simulada, sin romper la app.

## Uso con GitHub + Netlify

1. Crea un repo nuevo en GitHub.
2. Sube todos los archivos de este ZIP a la raíz del repo.
3. En Netlify:
   - Crea un nuevo sitio desde Git.
   - Selecciona el repo.
   - Build command: vacío.
   - Publish directory: `.`

4. Variables de entorno (en Netlify > Site settings > Environment):
   - `OPENAI_API_KEY` – tu clave de OpenAI (opcional pero recomendado).

5. Deploy.

## Uso en iPhone

1. Abre la URL del sitio en Safari.
2. Acepta el permiso de micrófono cuando lo pida.
3. Pulsa **Iniciar Grabación** para grabar audio.
4. Pulsa de nuevo para detener:
   - La app envía el audio al backend.
   - Se guarda la transcripción en el historial (solo en ese dispositivo).
5. Pulsa **Ver Historial** para consultar grabaciones anteriores.

**Nota:** Safari en iOS solo permite grabar micrófono, no audio interno de otras apps (Teams, Zoom, etc.). Esta app está enfocada a reuniones presenciales o voz en vivo cerca del iPhone.
