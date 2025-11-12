# Freshies (Expo + TypeScript)

## Quick start

- Install deps: `npm install`
- Dev server: `npm run ios` (or `npm run web`)

## Stack

- Expo Router, NativeWind Tailwind
- React Query, Zustand
- Supabase (planned), Sentry, PostHog

## EAS

- Edit bundle IDs later in `app.json` (ios.bundleIdentifier) per environment
- EAS profiles: `development`, `preview`, `production` in `eas.json`
- Secrets managed via EAS Secrets (OPENAI_API_KEY, ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SENTRY_DSN, POSTHOG_KEY)

## Next steps

- Wire Supabase schema & edge functions
- Add barcode providers (local seed + external fallback)
- Implement rules engine + AI explanations (OpenAI/Anthropic switch)
