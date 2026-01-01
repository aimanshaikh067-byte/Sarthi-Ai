// Vercel-compatible serverless function (Node 18+ runtime).
// Endpoint: POST /api/generate
// Body: { prompt: string, systemPrompt?: string, type?: 'text'|'json', model?: string }
// Environment variable required: GOOGLE_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, systemPrompt = '', type = 'text', model } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing required "prompt" string in request body.' });
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Server misconfigured: GOOGLE_API_KEY is missing.' });
    }

    const MODEL = model || 'gemini-2.5-flash-preview-09-2025';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const apiResp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await apiResp.json();

    if (!apiResp.ok) {
      const errorMsg = data?.error?.message || 'Generative API returned an error';
      return res.status(502).json({ error: errorMsg, detail: data });
    }

    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (type === 'json') {
      try {
        const cleaned = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return res.status(200).json({ type: 'json', data: parsed, raw: textResponse });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to parse JSON returned by model', raw: textResponse, parseError: e.message });
      }
    }

    return res.status(200).json({ type: 'text', data: textResponse, raw: data });
  } catch (err) {
    console.error('Server error /api/generate:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}