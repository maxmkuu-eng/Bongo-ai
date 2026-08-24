import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'bongo-ai', aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post('/api/chat', async (req, res) => {
  const message = String(req.body?.message ?? '').trim();
  if (!message) return res.status(400).json({ error: 'Message is required.' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: message,
    });

    res.json({ text: response.text ?? '' });
  } catch (error) {
    console.error('Gemini request failed:', error);
    res.status(502).json({ error: 'AI provider request failed.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`BONGO AI server listening on ${port}`);
});
