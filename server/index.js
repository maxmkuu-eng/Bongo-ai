import http from 'node:http';

const port = Number(process.env.PORT || 3000);

const send = (res, status, body) => {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(data);
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});

  if (req.method === 'GET' && req.url === '/api/health') {
    return send(res, 200, {
      ok: true,
      service: 'bongo-ai',
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) req.destroy();
    });

    req.on('end', async () => {
      try {
        const body = JSON.parse(raw || '{}');
        const message = String(body.message || '').trim();
        if (!message) return send(res, 400, { error: 'Message is required.' });
        if (!process.env.GEMINI_API_KEY) {
          return send(res, 503, { error: 'GEMINI_API_KEY is not configured on the server.' });
        }

        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        const response = await ai.models.generateContent({ model, contents: message });
        return send(res, 200, { text: response.text || '' });
      } catch (error) {
        console.error('Request failed:', error);
        return send(res, 502, { error: 'AI provider request failed.' });
      }
    });
    return;
  }

  return send(res, 404, { error: 'Not found' });
});

server.on('error', error => {
  console.error('BONGO AI server error:', error);
  process.exitCode = 1;
});

server.listen(port, '0.0.0.0', () => {
  console.log(`BONGO AI server listening on 0.0.0.0:${port}`);
});
