# WorkNest landing page (React + Vite)

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Accounts & email confirmation

WorkNest ships in **local mode**: accounts live in this browser (salted SHA-256,
key `worknest_credentials_v1`) until Supabase is configured. Local mode cannot
send email, so it signs you in immediately after registration.

With Supabase configured, registration uses Supabase's standard signup:

```
Create Account  ->  confirmation email  ->  click the link  ->  Sign In  ->  dashboard
```

- If your Supabase project has **Confirm email** OFF, signup returns a session
  and you land on the dashboard immediately.
- If it is ON, WorkNest tells you to check your inbox; the confirmation link
  signs the account in, and you then log in with the password you chose.
- No email templates need to be edited — the default Supabase confirmation
  template works as-is.

Setup: run `supabase/schema.sql` in the Supabase SQL editor, copy
`.env.example` to `.env` with your project URL and anon key, then restart
`npm run dev` (Vite reads `.env` only at startup). Set `GEMINI_API_KEY` in
`.env` for local photo analysis. For Vercel deployments, add `GEMINI_API_KEY`
under Project Settings → Environment Variables and redeploy. Keep this key
server-side; the image analysis endpoint is `/api/analyze-job-image`.

## Mumbai jobs map (Find Jobs page)

`/jobs` has a **Map / Cards** toggle and a sort menu (default, nearest to Fort,
pay high-to-low, pay low-to-high).

- The map is a self-contained, schematic SVG of South & Central Mumbai (no tiles
  or API key). Pins are placed from real neighbourhood coordinates in
  `src/data/mumbai.js`.
- A job is placed by matching its `location` text against the neighbourhoods in
  that file (e.g. "Colaba, Mumbai (On-site)"). Add `lat` / `lng` to a job to pin it
  exactly, or add a neighbourhood to `MUMBAI_AREAS`.
- Distance is straight-line from Fort (Horniman Circle).
- "Pay" sorting compares fixed jobs by amount and estimates hourly jobs as
  rate x 8 hrs x duration in days.
- Sample data lives in `src/data/initialData.js`. Bump `SEED_VERSION` in
  `src/context/AppContext.jsx` when you change it so browsers with saved state
  pick up the new sample records.

## Structure
```
worknest/
├── index.html
├── package.json
├── vite.config.js
├── public/favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx                     # page composition
    ├── data/content.js             # all copy + mock data
    ├── styles/global.css           # design tokens, base styles
    ├── assets/                     # drop hero.jpg / rohan.jpg here
    └── components/
        ├── layout/  Navbar, Footer
        ├── sections/ Hero, HeroBackdrop, Problem, Solution, Features,
        │             HowItWorks, Audiences, DigitalIdentity, FinalCTA
        └── ui/      Button, Logo, Avatar, DashboardPreview
```

## Images
The screenshot's photos (hero illustration, Rohan's portrait, job thumbnails) were not
reproducible from a flattened image, so they are drawn as SVG placeholders:
- Hero: `sections/HeroBackdrop.jsx` -> swap for `<img src="/src/assets/hero.jpg">`
- Portrait: `ui/Avatar.jsx` -> swap for `<img src="/src/assets/rohan.jpg">`
PKET8LvWX4pe8hmw
