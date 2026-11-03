/** Send a compressed photo to the server-side Gemini function. */
export async function analyzeImageForJob(imageData, fileName = '') {
  const mimeType = imageData.match(/^data:(image\/(?:jpeg|png|webp));base64,/i)?.[1];
  if (!mimeType) throw new Error('This photo format is not supported. Please use JPG, PNG, or WEBP.');

  const response = await fetch('/api/analyze-job-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData, mimeType, fileName }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Image analysis failed (${response.status}).`);
  if (!result.success || !result.data) throw new Error('Gemini returned no job details. Please try another photo.');
  return { success: true, source: 'gemini', data: result.data };
}
