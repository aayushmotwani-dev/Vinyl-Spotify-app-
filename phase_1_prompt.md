# Phase 1: MVP Antigravity Prompt

**Goal**: Build the core Turntable interaction and integrate the Spotify Web Playback SDK.

**Tasks**:
1. Setup the `web` React app with Vite and TypeScript.
2. Build the abstracted `MusicProvider` interface and implement the `SpotifyProvider` using the Web Playback SDK.
3. Build the core Turntable component:
   - A base platter SVG.
   - A spinning record SVG (texture + groove rings + glossy gradient). Apply CSS rotation matched to 33⅓ RPM.
   - A pivotable tonearm SVG. Map its radial distance to playback progress.
4. Wire up interactions:
   - Clicking play/pause should spin/stop the record.
   - Dragging the tonearm should seek through the currently playing track.
5. Create a simple "Shelf" grid view that lists available albums from Spotify to populate the turntable.

**Guidelines**:
- Focus on smooth, tactile interactions.
- Prioritize visual aesthetics and animations.
- Ensure the state management is kept clean with Zustand.
