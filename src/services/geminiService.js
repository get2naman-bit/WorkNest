/** Ask the server-side Gemini endpoint for editable job suggestions based on a title. */
export async function autofillJobFromTitle(title) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  try {
    const response = await fetch('/api/autofill-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `AI autofill failed (${response.status}).`);
    if (!result.success || !result.data) throw new Error('AI returned no job details. Please fill them manually.');
    return result;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('AI autofill timed out after 35 seconds. Please retry or fill in details manually.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
