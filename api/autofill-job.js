const ALLOWED_CATEGORIES = [
  'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'HVAC', 'Masonry', 'Roofing', 'General Labor',
];

const responseSchema = {
  type: 'OBJECT',
  properties: {
    category: { type: 'STRING', enum: ALLOWED_CATEGORIES },
    description: { type: 'STRING' },
    payRate: { type: 'STRING' },
    payType: { type: 'STRING', enum: ['Fixed', 'Hourly'] },
    duration: { type: 'STRING' },
    urgent: { type: 'BOOLEAN' },
    skills: { type: 'ARRAY', items: { type: 'STRING' } },
    requirements: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['category', 'description', 'payRate', 'payType', 'duration', 'urgent', 'skills', 'requirements'],
};

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function autofillJob(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST to generate job details.' });
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return send(res, 503, { error: 'Gemini is not configured on the server. Set GEMINI_API_KEY in the deployment environment.' });

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title || title.length > 180) return send(res, 400, { error: 'Enter a problem title between 1 and 180 characters.' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Draft practical job details for this repair/work problem title: "${title}". Return only the required structured fields. Do not return or change the title. Use sensible INR compensation and duration estimates, clearly word the description as a proposed scope, and never invent an address. Set urgent true only when the title clearly indicates immediate danger. Do not require licenses unless the title makes them clearly relevant. Provide 3-5 skills and 2-3 requirements.` }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1000, responseMimeType: 'application/json', responseSchema },
      }),
    });
    const payload = await response.json().catch(() => ({}));
    clearTimeout(timeout);
    if (!response.ok) {
      const detail = payload?.error?.message;
      console.error('Gemini job autofill failed:', response.status, detail || 'No error details returned');
      const status = response.status === 429 ? 429 : response.status >= 500 ? 502 : response.status === 400 || response.status === 403 ? response.status : 502;
      return send(res, status, { error: `Gemini could not generate job details: ${detail || `HTTP ${response.status}. Check API key, model access, and quota.`}` });
    }
    const output = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!output) return send(res, 502, { error: 'Gemini returned no job details. Please try again or fill them manually.' });
    const parsed = JSON.parse(output.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    if (!ALLOWED_CATEGORIES.includes(parsed.category)) parsed.category = 'General Labor';
    if (!['Fixed', 'Hourly'].includes(parsed.payType)) parsed.payType = 'Fixed';
    parsed.skills = Array.isArray(parsed.skills) ? parsed.skills.filter((item) => typeof item === 'string').slice(0, 5) : [];
    parsed.requirements = Array.isArray(parsed.requirements) ? parsed.requirements.filter((item) => typeof item === 'string').slice(0, 3) : [];
    return send(res, 200, { success: true, data: parsed });
  } catch (error) {
    clearTimeout(timeout);
    console.error('Gemini job autofill error:', error);
    return send(res, error.name === 'AbortError' ? 504 : 502, {
      error: error.name === 'AbortError' ? 'Gemini took too long to respond. Please retry or fill in the details manually.' : 'Could not read Gemini’s response. Please retry.',
    });
  }
}
