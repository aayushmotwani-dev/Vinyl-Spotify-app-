# Vinyl Deck

Vinyl Deck is a highly aesthetic, interactive web application that provides a photorealistic virtual turntable experience connected directly to a user's Spotify account. 

## Vercel Serverless Authentication
This project uses Vercel Serverless Functions to securely handle Spotify OAuth and store the refresh token in an HttpOnly cookie, meaning the client only handles the short-lived access token.

### Environment Variables
You must set the following environment variables:

1. **Local Development (`.env.local`)**:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   ```
   (Note: Both need to be set to the same value. `VITE_` is for the frontend redirect, while `SPOTIFY_CLIENT_ID` is for the Vercel Serverless functions.)

2. **Vercel Production (Environment Variables panel)**:
   Add `SPOTIFY_CLIENT_ID` with your Spotify Client ID. Vercel will also automatically expose this to the frontend if you add `VITE_SPOTIFY_CLIENT_ID`.

### Local Development
To test the serverless functions locally alongside the Vite frontend, you must use the Vercel CLI rather than just `npm run dev`:

1. Install Vercel CLI: `npm i -g vercel`
2. Link your project: `vercel link`
3. Run the local dev server: `vercel dev`

This ensures that requests to `/api/spotify/exchange` and `/api/spotify/refresh` are properly routed to the serverless functions in the `/api` directory, mirroring the production environment.
