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

const groqSchema = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: ALLOWED_CATEGORIES },
    description: { type: 'string' },
    payRate: { type: 'string' },
    payType: { type: 'string', enum: ['Fixed', 'Hourly'] },
    duration: { type: 'string' },
    urgent: { type: 'boolean' },
    skills: { type: 'array', items: { type: 'string' } },
    requirements: { type: 'array', items: { type: 'string' } },
  },
  required: ['category', 'description', 'payRate', 'payType', 'duration', 'urgent', 'skills', 'requirements'],
  additionalProperties: false,
};

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function autofillJob(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST to generate job details.' });
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!groqApiKey && !geminiApiKey) return send(res, 503, { error: 'AI is not configured. Set GROQ_API_KEY or GEMINI_API_KEY in the server environment.' });

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title || title.length > 180) return send(res, 400, { error: 'Enter a problem title between 1 and 180 characters.' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    let output = '';
    if (groqApiKey) {
      try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqApiKey}` },
        signal: controller.signal,
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: 'Create practical job posting suggestions for an Indian work marketplace. Treat budget and duration as estimates. Never invent a location. Do not change the user-provided title. Return only the requested JSON fields.' },
            { role: 'user', content: `Problem title: ${title}. Suggest a category, practical proposed scope, reasonable INR compensation and duration, urgency only if clearly immediate, 3-5 skills, and 2-3 requirements. Return valid JSON matching the schema.` },
          ],
          temperature: 0.2,
          max_completion_tokens: 1000,
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'job_details', strict: true, schema: groqSchema },
          },
        }),
      });
      const groqPayload = await groqResponse.json().catch(() => ({}));
      if (groqResponse.ok) {
        output = groqPayload?.choices?.[0]?.message?.content?.trim() || '';
      } else if (geminiApiKey) {
        console.warn('Groq autofill failed; falling back to Gemini:', groqResponse.status, groqPayload?.error?.message);
      } else {
        if (!geminiApiKey) {
          clearTimeout(timeout);
          return send(res, groqResponse.status === 429 ? 429 : 502, {
            error: `Groq could not generate job details: ${groqPayload?.error?.message || `HTTP ${groqResponse.status}. Check GROQ_API_KEY and Groq model access.`}`,
          });
        }
      }
      } catch (error) {
        if (error.name === 'AbortError' || !geminiApiKey) throw error;
        console.warn('Groq request failed; falling back to Gemini:', error.message);
      }
    }

    if (!output && geminiApiKey) {
    const models = [...new Set([
      process.env.GEMINI_JOB_MODEL || 'gemini-3.8-flash',
      process.env.GEMINI_JOB_FALLBACK_MODEL || 'gemini-3.6-flash',
    ])];
    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: `Draft practical job details for this repair/work problem title: "${title}". Return only the required structured fields. Do not return or change the title. Use sensible INR compensation and duration estimates, clearly word the description as a proposed scope, and never invent an address. Set urgent true only when the title clearly indicates immediate danger. Do not require licenses unless the title makes them clearly relevant. Provide 3-5 skills and 2-3 requirements.` }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1000, responseMimeType: 'application/json', responseSchema },
    });

    let response;
    let payload = {};
    let lastError;
    for (const model of models) {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
        signal: controller.signal,
        body: requestBody,
      });
      payload = await response.json().catch(() => ({}));
      if (response.ok) break;

      lastError = payload?.error?.message || `HTTP ${response.status}`;
      console.error(`Gemini job autofill failed on ${model}:`, response.status, lastError);
      // Retry transient model capacity/quota errors on the configured fallback.
      if (![429, 500, 502, 503, 504].includes(response.status)) break;
    }
    clearTimeout(timeout);
    if (!response.ok) {
      const status = response.status === 429 ? 429 : response.status >= 500 ? 502 : response.status;
      return send(res, status, { error: `Gemini could not generate job details: ${lastError || 'The AI service is temporarily unavailable. Please retry shortly.'}` });
    }
    output = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    }
    if (!output) return send(res, 502, { error: 'The AI provider returned no job details. Please try again or fill them manually.' });
    const parsed = JSON.parse(output.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    if (!ALLOWED_CATEGORIES.includes(parsed.category)) parsed.category = 'General Labor';
    if (!['Fixed', 'Hourly'].includes(parsed.payType)) parsed.payType = 'Fixed';
    parsed.skills = Array.isArray(parsed.skills) ? parsed.skills.filter((item) => typeof item === 'string').slice(0, 5) : [];
    parsed.requirements = Array.isArray(parsed.requirements) ? parsed.requirements.filter((item) => typeof item === 'string').slice(0, 3) : [];
    return send(res, 200, { success: true, data: parsed });
  } catch (error) {
    clearTimeout(timeout);
    console.error('Job autofill error:', error);
    return send(res, error.name === 'AbortError' ? 504 : 502, {
      error: error.name === 'AbortError' ? 'The AI provider took too long to respond. Please retry or fill in the details manually.' : 'Could not read the AI provider response. Please retry.',
    });
  }
}
