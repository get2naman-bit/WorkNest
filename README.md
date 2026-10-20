# WorkNest landing page (React + Vite)

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Accounts & first-time email verification

WorkNest ships in **local mode**: accounts live in this browser (salted SHA-256,
key `worknest_credentials_v1`) until Supabase is configured. Local mode cannot
send email, so it signs you in immediately after registration.

With Supabase configured, **new accounts must be verified with a 6-digit OTP**
sent to the sign-up address:

```
Create Account  ->  account created + OTP emailed  ->  enter 6-digit code  ->  dashboard
```

- Supabase → Authentication → Providers → Email: turn **Confirm email** ON.
- Supabase → Authentication → Email Templates → **Confirm signup** and
  **Magic link or OTP**: show `{{ .Token }}` as visible text — that is
  Supabase's 6-digit code (there is no `{{ .Code }}` variable). Do not wrap
  it in `<a href>`; it is a code, not a URL.
- The OTP step also has **Resend code** (Supabase rate-limits to roughly one
  message per minute) and **Use a different email**.
- Signup creates the account in the same call that sends the code, so exactly
  one email goes out per registration.

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
