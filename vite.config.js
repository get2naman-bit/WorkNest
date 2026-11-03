import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function localGeminiFunction() {
  return {
    name: 'worknest-gemini-api',
    configureServer(server) {
      server.middlewares.use('/api/autofill-job', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 6 * 1024 * 1024) {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Request is too large.' }));
            return;
          }
          chunks.push(chunk);
        }
        try {
          req.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid autofill request.' }));
          return;
        }
        const { default: handler } = await import('./api/autofill-job.js');
        await handler(req, res);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Keep the Gemini key on the server for both Vite development and Vercel.
  process.env.GEMINI_API_KEY ||= env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
  process.env.GROQ_API_KEY ||= env.GROQ_API_KEY;
  process.env.GROQ_MODEL ||= env.GROQ_MODEL;
  return { plugins: [react(), localGeminiFunction()] };
});
