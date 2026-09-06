const DEFAULT_ALLOWED_ORIGINS = [
  'https://supermoonzzz.github.io',
  'http://localhost:8000',
  'http://localhost:3000',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:3000'
];
const DEEPSEEK_CHAT_URL = `${(process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '')}/chat/completions`;

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin, host) {
  if (!origin) return true;
  if (allowedOrigins().includes(origin)) return true;

  try {
    return new URL(origin).host === host;
  } catch (error) {
    return false;
  }
}

function corsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const host = request.headers.get('host') || '';
  const headers = new Headers({
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-HRI-Proxy-Token',
    'Access-Control-Max-Age': '86400'
  });

  if (origin && isOriginAllowed(origin, host)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  return headers;
}

function jsonResponse(request, status, payload) {
  const headers = corsHeaders(request);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(payload), { status, headers });
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, 405, { error: { message: 'Method not allowed. Use POST.' } });
  }

  const origin = request.headers.get('origin') || '';
  const host = request.headers.get('host') || '';
  if (!isOriginAllowed(origin, host)) {
    return jsonResponse(request, 403, { error: { message: 'Origin is not allowed by this proxy.' } });
  }

  const expectedToken = process.env.HRI_PROXY_TOKEN;
  if (expectedToken && request.headers.get('x-hri-proxy-token') !== expectedToken) {
    return jsonResponse(request, 401, { error: { message: 'Missing or invalid HRI proxy token.' } });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return jsonResponse(request, 500, { error: { message: 'Server missing DEEPSEEK_API_KEY.' } });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse(request, 400, { error: { message: 'Invalid JSON request body.' } });
  }

  const prompt = String(body.prompt || '').trim();
  if (!prompt) {
    return jsonResponse(request, 400, { error: { message: 'Missing prompt.' } });
  }

  if (prompt.length > 60000) {
    return jsonResponse(request, 413, { error: { message: 'Prompt is too large.' } });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const deepseekResponse = await fetch(DEEPSEEK_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: Number.isFinite(Number(body.temperature)) ? Number(body.temperature) : 0.02
      }),
      signal: controller.signal
    });

    const text = await deepseekResponse.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      data = { error: { message: text || 'DeepSeek returned a non-JSON response.' } };
    }

    return jsonResponse(request, deepseekResponse.status, data);
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'DeepSeek request timed out.'
      : (error.message || 'DeepSeek request failed.');
    return jsonResponse(request, 502, { error: { message } });
  } finally {
    clearTimeout(timeout);
  }
}
