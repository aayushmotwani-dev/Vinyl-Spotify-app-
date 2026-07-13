# AI Development Context

This document is intended to provide context, architecture details, and recent development history for any AI agents or developers working on this project.

## Project Overview
**Vinyl Deck** is a highly interactive, photorealistic Spotify web player that turns a user's Spotify library into a collection of retro vinyl records. 
- **Tech Stack:** React 18, TypeScript, Vite, Vanilla CSS (with hardware-accelerated transforms).
- **Backend:** Vercel Serverless Functions (Node.js) used exclusively for secure token exchange.
- **APIs:** Spotify Web API & Spotify Web Playback SDK.

## Architecture & Monorepo Structure
This project uses a monorepo structure (npm workspaces).
- **`apps/web/`**: Contains the main Vite React application and the Vercel Serverless functions.
- **Vercel Deployment**: The project **must** have its Root Directory set to `apps/web` in the Vercel Dashboard Settings. If it is set to the repository root, the Serverless API functions (`apps/web/api`) will fail to deploy, and SPA routing will break.
- **SPA Routing**: The `apps/web/vercel.json` file handles rewriting all unmatched frontend routes (like `/callback`) to `/index.html`, while allowing `/api/(.*)` to route to the Serverless functions.

## Security Model (Spotify PKCE)
The application uses **PKCE (Proof Key for Code Exchange)** for Spotify authentication.
- **No Client Secret:** This app does *not* use a Spotify Client Secret. This is intentional and secure.
- **Public Client ID:** The `VITE_SPOTIFY_CLIENT_ID` is exposed to the frontend. In a PKCE flow, the Client ID is public knowledge and is perfectly safe to expose. Security relies on the dynamically generated `code_verifier`, the SHA-256 `code_challenge`, and strict Redirect URI whitelisting on the Spotify Developer Dashboard.
- **Token Storage:** The frontend only handles the short-lived access token. The Serverless functions (`exchange.ts` and `refresh.ts`) handle fetching the refresh token and storing it securely in an **HttpOnly, SameSite=Strict cookie**. Malicious scripts cannot access the refresh token.

## Recent Development History & Fixes
- **Vercel Monorepo Fix:** Resolved a `404 NOT_FOUND` and `[UNRESOLVED_ENTRY]` build error by enforcing the `apps/web` Root Directory setting in Vercel, ensuring both Vite and Serverless Functions compile correctly in the same context.
- **Asset Optimization:** Replaced heavy `.png` UI textures (scratches, splatters, turntable bases) with highly optimized `.webp` formats for instantaneous loading.
- **Codebase Cleanup:** Permanently deleted legacy python scripts (used for initial image processing), old HTML mockups, `.recovered` backup files, and outdated markdown plans to keep the codebase efficient and clean.
- **Dynamic Wear & Tear:** Implemented a feature where the visual "wear and tear" (scratches/dust) on the vinyl dynamically randomizes on every track switch.
- **Theme Restored:** Restored the `retro.jpg` theme background which is the default 1970s aesthetic.

## Next Steps / Roadmap
- Polish mobile touch gestures (specifically for dragging the tonearm and platter).
- Add more turntable themes (futuristic, transparent acrylic, etc.).
- Expand the custom BottomSheet interface for mobile users.
