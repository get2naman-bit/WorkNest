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
`npm run dev` (Vite reads `.env` only at startup).

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
    ├── assets/                     # drop hero.jpg / alex.jpg here
    └── components/
        ├── layout/  Navbar, Footer
        ├── sections/ Hero, HeroBackdrop, Problem, Solution, Features,
        │             HowItWorks, Audiences, DigitalIdentity, FinalCTA
        └── ui/      Button, Logo, Avatar, DashboardPreview
```

## Images
The screenshot's photos (hero illustration, Alex's portrait, job thumbnails) were not
reproducible from a flattened image, so they are drawn as SVG placeholders:
- Hero: `sections/HeroBackdrop.jsx` -> swap for `<img src="/src/assets/hero.jpg">`
- Portrait: `ui/Avatar.jsx` -> swap for `<img src="/src/assets/alex.jpg">`
PKET8LvWX4pe8hmw
