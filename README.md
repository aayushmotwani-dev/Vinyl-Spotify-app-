# Retro Vinyl Spotify Player

A beautifully designed, highly interactive, and performant Spotify web player built with React, Vite, and Vercel. This application turns your Spotify library into a collection of retro vinyl records. 

## Features
-  **Interactive Vinyl Crates:** Browse your Saved Albums, Playlists, and Liked Songs as physical vinyl records in a "crate-digger" style interface.
-  **Dynamic Vinyl Sleeves & Spines:** The edge thickness of each record spine dynamically scales based on the total duration of the album or the number of tracks in the playlist!
-  **Rich Animations:** Smooth 60fps CSS hardware-accelerated animations for platter rotation, tonearm mechanics, and vinyl extraction.
-  **Multiple Turntable Styles & Wear Grades:** Choose from a variety of beautifully rendered turntable styles (Retro Wood, Clear Acrylic, Technics, etc.) and apply customizable "wear & tear" overlays.
-  **Optimized Performance:** Features smart React memoization, `requestAnimationFrame` throttling, and `.webp` compression for a completely lag-free experience on both mobile and desktop.
-  **Fully Responsive:** Feels like a premium native application with a custom BottomSheet interface on mobile devices.

---

## Getting Started

### Prerequisites
1. **Node.js** (v18+ recommended)
2. **npm**, **yarn**, or **pnpm**
3. A **Spotify Premium Account** (Required for Spotify Web Playback SDK to play music)

### 1. Create a Spotify Developer App
To run this application, you need to create your own Spotify Developer App to get a Client ID.
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. Click **Create app**.
3. Fill in the App name and description.
4. For the **Redirect URIs**, add the following:
   - `http://localhost:5173/callback` (for local development)
   - `https://your-vercel-domain.vercel.app/callback` (if you are deploying to Vercel)
5. Under "Which API/SDKs are you planning to use?", check **Web API** and **Web Playback SDK**.
6. Save and go to your app settings to find your **Client ID**. (You do NOT need a Client Secret because this app uses modern PKCE authentication).

### 2. Project Setup
Clone this repository and install dependencies:

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
npm install
```

### 3. Environment Variables
Create a new file named `.env.local` in the root of the project (you can also just rename the included `.env.example` file to `.env.local`). 

Add your Spotify Client ID to the file like this:

```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
```

*(Note: We use `.env.local` instead of a regular `.env` file because it is included in the `.gitignore`. This ensures that if you decide to push your own version of this code to GitHub later, your personal Spotify credentials will remain completely safe and hidden from the public!)*

### 4. Run the Development Server
Start the Vite development server:

```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`. 
*Note: Depending on your network, you may need to whitelist your local IP address in the Spotify Developer Dashboard if you want to access it from your phone on the same WiFi network.*

---

## Deployment (Vercel)

This project is configured to be easily deployed on Vercel. The authentication flow uses Vercel Serverless Functions located in the `apps/web/api/` directory.

1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` from the root directory to link your project.
3. When prompted to set up the project, say **Yes**.
4. Important: Make sure to add the `VITE_SPOTIFY_CLIENT_ID` environment variable in your Vercel Project Settings!
5. Add your new Vercel production URL (e.g., `https://your-app.vercel.app/callback`) to the **Redirect URIs** in your Spotify Developer Dashboard.
6. Run `vercel --prod` to deploy to production!

---

## Technology Stack
- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Vanilla CSS with custom design tokens, modern pseudo-selectors, and hardware-accelerated transforms
- **Backend/Auth:** Vercel Serverless Functions (Node.js) for PKCE token exchange and refreshing
- **APIs:** Spotify Web API & Spotify Web Playback SDK

## License
MIT License
