const ALLOWED_CATEGORIES = [
  'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'HVAC', 'Masonry', 'Roofing', 'General Labor',
];

const responseSchema = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    category: { type: 'STRING', enum: ALLOWED_CATEGORIES },
    description: { type: 'STRING' },
    payRate: { type: 'STRING' },
    payType: { type: 'STRING', enum: ['Fixed', 'Hourly'] },
    duration: { type: 'STRING' },
    urgent: { type: 'BOOLEAN' },
    skills: { type: 'ARRAY', items: { type: 'STRING' } },
    requirements: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['title', 'category', 'description', 'payRate', 'payType', 'duration', 'urgent', 'skills', 'requirements'],
};

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function analyzeJobImage(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST to analyze a job photo.' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return send(res, 503, { error: 'Gemini is not configured on the server. Set GEMINI_API_KEY in the deployment environment.' });

  const { imageData, mimeType } = req.body || {};
  if (typeof imageData !== 'string' || !/^image\/(jpeg|png|webp)$/.test(mimeType || '')) {
    return send(res, 400, { error: 'Upload a JPG, PNG, or WEBP image before analyzing.' });
  }
  const base64 = imageData.replace(/^data:image\/(?:jpeg|png|webp);base64,/, '');
  if (!base64 || base64.length > 5_500_000) return send(res, 413, { error: 'The photo is too large. Choose a smaller image and try again.' });

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Inspect this repair/worksite photo and draft a useful job posting for an Indian hiring marketplace. Return only the required structured fields. Describe visible evidence separately from assumptions. Suggest a reasonable INR budget and duration as estimates, not facts. Set urgent true only for a clearly visible immediate hazard. Do not invent licenses or qualifications; list practical skills and ask for relevant experience/tools. Do not infer the location from the image. If the issue is unclear, say so in the description and use General Labor. Keep the title specific, description 2-3 sentences, skills 3-5 items, and requirements 2-3 items.` },
              { inlineData: { mimeType, data: base64 } },
            ],
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
            responseMimeType: 'application/json',
            responseSchema,
          },
        }),
      }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const apiMessage = payload?.error?.message;
      console.error('Gemini image analysis request failed:', response.status, apiMessage || 'No error details returned');
      if (response.status === 400 || response.status === 403) {
        return send(res, response.status, { error: `Gemini rejected the request: ${apiMessage || 'Check that the API key is valid and Gemini API is enabled for its Google project.'}` });
      }
      if (response.status === 404) {
        return send(res, 502, { error: `Gemini model or endpoint is unavailable: ${apiMessage || 'Check the configured model name and API access.'}` });
      }
      if (response.status === 429) {
        return send(res, 429, { error: `Gemini rate limit or quota reached: ${apiMessage || 'Check the API project quota and try again later.'}` });
      }
      if (response.status >= 500) {
        return send(res, 502, { error: `Gemini is temporarily unavailable (HTTP ${response.status}). Please try again shortly.` });
      }
      return send(res, 502, { error: `Gemini request failed (HTTP ${response.status}): ${apiMessage || 'Check the API configuration and try again.'}` });
    }

    const output = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!output) return send(res, 502, { error: 'Gemini returned no analysis. Try a clearer photo of the issue.' });

    const parsed = JSON.parse(output.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    if (!ALLOWED_CATEGORIES.includes(parsed.category)) parsed.category = 'General Labor';
    if (!['Fixed', 'Hourly'].includes(parsed.payType)) parsed.payType = 'Fixed';
    parsed.skills = Array.isArray(parsed.skills) ? parsed.skills.filter((item) => typeof item === 'string').slice(0, 5) : [];
    parsed.requirements = Array.isArray(parsed.requirements) ? parsed.requirements.filter((item) => typeof item === 'string').slice(0, 3) : [];
    return send(res, 200, { success: true, data: parsed });
  } catch (error) {
    console.error('Gemini image analysis error:', error);
    return send(res, 502, { error: 'Could not read Gemini’s response. Please retry with another photo.' });
  }
}
