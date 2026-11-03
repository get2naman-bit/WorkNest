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

const TOTAL_TIMEOUT_MS = 55_000;
const GEMINI_MODEL_TIMEOUT_MS = 24_000;
const GROQ_TIMEOUT_WITH_FALLBACK_MS = 12_000;
const GROQ_TIMEOUT_MS = 50_000;

async function fetchJsonWithTimeout(url, options, requestController, deadlineAt, timeoutMs) {
  const providerController = new AbortController();
  const abortProvider = () => providerController.abort();
  if (requestController.signal.aborted) abortProvider();
  else requestController.signal.addEventListener('abort', abortProvider, { once: true });

  const remainingMs = Math.max(1, deadlineAt - Date.now());
  const timeout = setTimeout(abortProvider, Math.min(timeoutMs, remainingMs));
  try {
    const response = await fetch(url, { ...options, signal: providerController.signal });
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  } finally {
    clearTimeout(timeout);
    requestController.signal.removeEventListener('abort', abortProvider);
  }
}

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
  const deadlineAt = Date.now() + TOTAL_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), TOTAL_TIMEOUT_MS);
  try {
    let output = '';
    if (groqApiKey) {
      try {
      const { response: groqResponse, payload: groqPayload } = await fetchJsonWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqApiKey}` },
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
      }, controller, deadlineAt, geminiApiKey ? GROQ_TIMEOUT_WITH_FALLBACK_MS : GROQ_TIMEOUT_MS);
      if (groqResponse.ok) {
        output = groqPayload?.choices?.[0]?.message?.content?.trim() || '';
      } else if (geminiApiKey) {
        console.warn('Groq autofill failed; falling back to Gemini:', groqResponse.status, groqPayload?.error?.message);
      } else {
        return send(res, groqResponse.status === 429 ? 429 : 502, {
          error: `Groq could not generate job details: ${groqPayload?.error?.message || `HTTP ${groqResponse.status}. Check GROQ_API_KEY and Groq model access.`}`,
        });
      }
      } catch (error) {
        if (error.name === 'AbortError' && (controller.signal.aborted || !geminiApiKey)) throw error;
        if (!geminiApiKey) throw error;
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
    for (let index = 0; index < models.length; index += 1) {
      const model = models[index];
      try {
        const result = await fetchJsonWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
          body: requestBody,
        }, controller, deadlineAt, GEMINI_MODEL_TIMEOUT_MS);
        response = result.response;
        payload = result.payload;
      } catch (error) {
        if (error.name !== 'AbortError' || controller.signal.aborted || index === models.length - 1) throw error;
        lastError = 'The Gemini model timed out; trying the fallback model.';
        console.warn(`Gemini job autofill timed out on ${model}; trying the fallback model.`);
        continue;
      }
      if (response.ok) break;

      lastError = payload?.error?.message || `HTTP ${response.status}`;
      console.error(`Gemini job autofill failed on ${model}:`, response.status, lastError);
      // Retry transient model capacity/quota errors on the configured fallback.
      if (![429, 500, 502, 503, 504].includes(response.status)) break;
    }
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
    console.error('Job autofill error:', error);
    return send(res, error.name === 'AbortError' ? 504 : 502, {
      error: error.name === 'AbortError' ? 'The AI provider took too long to respond. Please retry or fill in the details manually.' : 'Could not read the AI provider response. Please retry.',
    });
  } finally {
    clearTimeout(timeout);
  }
}
