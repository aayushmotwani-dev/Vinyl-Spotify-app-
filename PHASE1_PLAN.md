# Vinyl Deck — Phase 1 Plan

## Decisions locked in

- **Playback model**: Remote control / visualizer. The app never plays audio itself. It reads Spotify's "what's playing right now" state and sends play/pause/seek commands to whichever device is currently active (phone, laptop, speaker). No DRM/EME, works identically in any webview, on any platform.
- **Spotify account**: Premium confirmed → full transport controls (play, pause, seek) are in scope for Phase 1, not stubbed.
- **Packaging**: Plain Vite + React + TypeScript web app for now. No Tauri yet — that's Phase 4.
- **Package manager**: npm.
- **Spotify integration**: custom hooks, no SDK wrapper. We're not using the Web Playback SDK at all under this model — just normal authenticated fetch calls to the Web API.

## Goal of Phase 1

Prove the entire data pipe end to end, with the ugliest possible visuals, before any design work starts:

1. Log in with Spotify.
2. Read what's currently playing, including album art, progress, and play state.
3. Show a circle spinning at the correct real-world speed, only while playback is active.
4. Send play/pause back to Spotify and see it take effect on your phone/laptop.

If all four of those work, every later phase (shelf, themes, tonearm, multiple skins) is "just" UI built on top of a working core.

## Repo structure

```
vinyl-deck/
├── apps/
│   └── web/                  # Vite + React + TS app
├── packages/
│   └── turntable-engine/     # placeholder package, wired up but empty for now
├── package.json              # npm workspace root
├── .gitignore
└── README.md
```

## Step 0 — Register the Spotify app

Do this in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):

- Create a new app.
- **Redirect URI**: `http://127.0.0.1:5173/callback`

  Important detail: as of Spotify's 2025 security update, plain `localhost` redirect URIs are no longer accepted — only loopback IP literals like `127.0.0.1` (or HTTPS) work Any redirect URI using HTTP will stop being supported, except loopback IP address literals such as http://127.0.0.1 for IPv4 and http://[::1] for IPv6. Vite's dev server defaults to port 5173, so make sure you actually open `http://127.0.0.1:5173` in the browser during dev, not `http://localhost:5173` — Spotify treats these as different hosts and the token exchange will fail with "Invalid redirect URI" if they don't match exactly.
- Once you have a Netlify URL later, add that as a **second** redirect URI (e.g. `https://your-app.netlify.app/callback`) so the same client works in dev and production.
- Copy the **Client ID**. PKCE doesn't use a client secret, so there's nothing else to store securely.
- **Scopes** we'll request at login:
  - `user-read-playback-state` — device info, progress, play/pause state
  - `user-read-currently-playing` — current track + album art
  - `user-modify-playback-state` — play, pause, seek (this is the one that requires Premium to actually have an effect)

## Step 1 — Scaffold

- Initialize the repo root as an npm workspace (`package.json` with `"workspaces": ["apps/*", "packages/*"]`).
- `cd apps && npm create vite@latest web -- --template react-ts`
- Create `packages/turntable-engine` with a minimal `package.json` so the workspace linking is verified, even though it's empty for now.
- Add `.env.local` (gitignored) with `VITE_SPOTIFY_CLIENT_ID=...`, plus a committed `.env.example` showing the variable name without the value.

## Step 2 — Auth (Authorization Code with PKCE)

This is the fiddliest part to get right, so here's the exact shape of it:

1. On "Connect Spotify" click: generate a random `code_verifier`, derive a `code_challenge` from it via SHA-256 (Web Crypto API, base64url-encoded), and store the verifier in `sessionStorage`.
2. Redirect to `https://accounts.spotify.com/authorize` with `client_id`, `response_type=code`, `redirect_uri`, `scope`, `code_challenge_method=S256`, `code_challenge`, and a random `state` value.
3. Spotify redirects back to `/callback?code=...&state=...`. Verify `state` matches, then POST to `https://accounts.spotify.com/api/token` with `grant_type=authorization_code`, the `code`, `redirect_uri`, `client_id`, and the stored `code_verifier`.
4. Store the returned `access_token`, `refresh_token`, and `expires_in` (as an absolute expiry timestamp) in `localStorage`.
5. Before any API call, check if the access token is expired (or about to expire); if so, silently POST `grant_type=refresh_token` with the stored refresh token to get a new access token.

Reference snippet for the PKCE challenge generation (the part most likely to be copy-pasted wrong):

```ts
function base64UrlEncode(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function generateCodeVerifier(length = 64) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer);
}

export async function generateCodeChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}
```

## Step 3 — `useNowPlaying` hook

- Poll `GET https://api.spotify.com/v1/me/player` every 3–5 seconds (don't go faster — be kind to the rate limit, and it's not needed since we interpolate between polls).
- Handle the case where this returns **204 No Content** — meaning nothing is playing or no active device. The UI should show a friendly "nothing playing — hit play on your phone" state, not crash.
- From the response, extract: `item.album.images[0].url` (album art), `item.name` / `item.artists`, `progress_ms`, `item.duration_ms`, `is_playing`, `device.name`.
- Between polls, use `requestAnimationFrame` to advance a local `progress_ms` estimate by real elapsed time whenever `is_playing` is true, so the record doesn't visually "jump" every few seconds — it just keeps smoothly going and gently corrects itself when the next poll comes in.

## Step 4 — `useTransportControls` hook

- `play()` → `PUT /v1/me/player/play`
- `pause()` → `PUT /v1/me/player/pause`
- `seek(positionMs)` → `PUT /v1/me/player/seek?position_ms=...`
- All three return `204` on success with no body. Handle `404`(no active device) by surfacing a clear message rather than failing silently.

## Step 5 — Minimal UI

A single screen in `apps/web/src/App.tsx`:

- "Connect Spotify" button (hidden once authenticated).
- A circular `<div>` showing the album art as a background image, rotating via CSS:
  - 33⅓ RPM = one full rotation every 1.8 seconds → `animation: spin 1.8s linear infinite`
  - `animation-play-state: running` when `is_playing`, `paused` otherwise
- Track name and artist as plain text below it.
- A play/pause button wired to the transport hook.

No shelf, no tonearm, no themes — just "is the data alive and does the circle spin at the right speed."

## Verification checklist

- [ ] Clicking "Connect Spotify" redirects to Spotify and back without a redirect-URI mismatch error.
- [ ] After connecting, the currently-playing track and album art appear within ~5 seconds.
- [ ] Starting/pausing playback on your **phone** is reflected in the web app within a few seconds.
- [ ] Pressing pause in the **web app** actually pauses your phone's playback (Premium-only effect).
- [ ] The circle spins continuously while playing and freezes immediately when paused.
- [ ] Leaving the tab open for over an hour still works (tests the token refresh).
- [ ] Closing nothing is playing anywhere → app shows a graceful "nothing playing" state instead of an error.

## Explicitly out of scope for Phase 1

Shelf UI, vinyl pull-out animation, draggable tonearm/needle, multiple turntable aesthetics, YouTube/Apple Music providers, sound effects, and any Tauri packaging. All of these build on top of this core once it's proven.
