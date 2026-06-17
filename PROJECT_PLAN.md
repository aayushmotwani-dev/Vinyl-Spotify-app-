# Vinyl App Project Plan

## Overview
A cross-platform, multi-service vinyl record player app that focuses on tactile interaction metaphors (record spinning, needle dropping, realistic cabinet themes) and deep aesthetics.

## UI/UX Plan
- **Home (The Shelf)**: A horizontal scroll or grid rendered with CSS 3D transforms. Pulls from Spotify saved albums and playlists. 
- **The Turntable**: Layered SVG with a base platter graphic, record layer (album art texture + groove rings + radial gloss), and center label. Real rotation speeds (33⅓ RPM = 1.8s, 45 RPM = 1.33s).
- **The Tonearm/Needle**: Separate SVG pivoting from a fixed point. Draggable for seek. Lift off = pause, drop on = play (with crackle/pop sound).
- **Cabinet Buttons**: Power toggle, start/stop lever, and speed selector (33/45/78).
- **Multiple Aesthetics**: Themeable turntable component (e.g., silver/black modern, 70s walnut wood, pastel lo-fi, minimalist white).

## Tech Stack
- **Frontend**: React + TypeScript + Vite, Framer Motion (shelf animation), plain SVG + CSS (turntable).
- **State**: Zustand for player state.
- **Music Providers**: Abstracted `MusicProvider` interface with `SpotifyProvider` (Web Playback SDK) as the primary. `YouTubeProvider` (IFrame API) and `AppleMusicProvider` (MusicKit JS) as secondary.
- **Auth/Backend**: Netlify Functions for Spotify OAuth code exchange.
- **Packaging**: Tauri 2.0 for Windows/macOS/Linux/iOS/Android from the single React codebase.

## Repository Structure
A monorepo keeping the shared engine reusable:

```text
vinyl-deck/
├── apps/
│   ├── web/                # React + Vite app (also source for Tauri)
│   ├── desktop/            # Tauri config (Win/Mac/Linux)
│   ├── mobile/             # Tauri mobile config (iOS/Android)
│   └── tv/                 # Future: Android TV / tvOS shells
├── packages/
│   ├── turntable-engine/   # SVG record, tonearm physics, speed math
│   ├── music-providers/    # Spotify / YouTube / Apple Music adapters
│   └── themes/             # Asset packs per aesthetic
├── .github/workflows/      # CI: lint, build, deploy web demo
├── README.md
└── LICENSE
```

## Phased Roadmap
1. **Phase 0 (Setup)**: Scaffold the monorepo, register a Spotify Developer app, lock in 2-3 starter themes.
2. **Phase 1 (MVP)**: Spotify auth + Web Playback SDK, one turntable theme, real-speed rotation with album art, draggable tonearm for seek + play/pause, basic shelf from saved albums.
3. **Phase 2 (Polish & Themes)**: Playlists-as-vinyls, shelf pull-out animation, remaining turntable aesthetics, needle-drop sound, cabinet buttons fully wired.
4. **Phase 3 (YouTube Mode)**: Paste-a-link turntable using IFrame Player API.
5. **Phase 4 (Cross-platform Packaging)**: Tauri builds for desktop and mobile.
6. **Phase 5 (Stretch)**: Apple Music integration, Android TV/Apple TV shells, AirPlay/Chromecast output.
