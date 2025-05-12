// server.jsx
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const speech = require('@google-cloud/speech');

const app = express();
const upload = multer({ dest: 'uploads/' });
const client = new speech.SpeechClient();

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  const audioBytes = fs.readFileSync(req.file.path).toString('base64');

  const request = {
    audio: { content: audioBytes },
    config: {
      encoding: 'LINEAR16', // ajusta según el tipo de audio
      sampleRateHertz: 44100,
      languageCode: 'es-MX',
    },
  };

  try {
    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    res.json({ transcription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

app.listen(3001, () => console.log('API escuchando en http://localhost:3001'));
