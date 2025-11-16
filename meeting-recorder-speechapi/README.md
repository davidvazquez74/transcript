# Grabación de Reuniones – Versión sin OpenAI (Web Speech API)

Esta versión NO usa OpenAI, ni backend, ni funciones de Netlify.
Todo se hace en el navegador usando la Web Speech API
(SpeechRecognition / webkitSpeechRecognition), que es gratuita.

## Qué hace

- Botón **Iniciar Grabación**:
  - Arranca `SpeechRecognition` del navegador.
  - Transcribe lo que hablas en tiempo real.
- Botón **Detener Grabación**:
  - Para el reconocimiento.
  - Guarda el texto transcrito en un **historial local** (localStorage).
- Botón **Ver Historial**:
  - Muestra la lista de grabaciones con fecha y texto.

No se guardan audios, solo texto.  
No se llama a ningún servicio de OpenAI ni a funciones serverless.

## Limitaciones

- Depende de que el navegador soporte la Web Speech API.
  - En muchos iPhone con Safari funciona.
  - Si no está soportada, verás el mensaje:
    - "El navegador no soporta reconocimiento de voz (SpeechRecognition)."
- El reconocimiento lo proporciona Apple/Google (según navegador),
  no esta app: la calidad y el idioma dependen del motor del sistema.

## Despliegue (GitHub + Netlify)

1. Sube todos estos archivos a un repo GitHub (en la raíz).
2. En Netlify:
   - Nuevo sitio desde Git.
   - Build command: vacío.
   - Publish directory: `.`

No hace falta configurar variables de entorno ni funciones.

