import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Allow large payloads for base64 images
app.json_limit = '100mb';
app.use(express.json({ limit: '100mb' }));

// ---------- Gemini proxy endpoint ----------
app.post('/api/analyze', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const { prompt, imageParts, model } = req.body;

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }, ...imageParts] }],
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text;
    res.json({ result: text });
  } catch (err) {
    console.error('Gemini API error:', err?.message || err);
    res.status(502).json({ error: 'Gemini API request failed.', details: err?.message });
  }
});

// ---------- Serve built frontend in production ----------
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback – serve index.html for any non-API route
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ---------- Start ----------
const PORT = process.env.PORT || 7860;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
