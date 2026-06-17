// Base64UrlEncode
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

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
// NOTE: You must whitelist your network IP address (e.g. http://192.168.178.107:5173/callback) in the Spotify Developer Dashboard.
const redirectUri = window.location.origin + '/callback';
const scopes = 'user-read-playback-state user-read-currently-playing user-modify-playback-state playlist-read-private user-library-read';

export async function login() {
  if (!clientId) {
    alert('VITE_SPOTIFY_CLIENT_ID is not set. Please add it to your .env.local file.');
    return;
  }
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateCodeVerifier(16); // just a random string

  sessionStorage.setItem('spotify_code_verifier', verifier);
  sessionStorage.setItem('spotify_auth_state', state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    state: state,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// In-memory token storage
let memoryAccessToken: string | null = null;
let memoryExpiresAt: number | null = null;

export function clearSession() {
  memoryAccessToken = null;
  memoryExpiresAt = null;
}

export async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  const savedState = sessionStorage.getItem('spotify_auth_state');
  const verifier = sessionStorage.getItem('spotify_code_verifier');

  if (!code || !state || state !== savedState || !verifier) {
    throw new Error('Invalid callback parameters or state mismatch');
  }

  sessionStorage.removeItem('spotify_auth_state');
  sessionStorage.removeItem('spotify_code_verifier');

  const response = await fetch('/api/spotify/exchange', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      redirectUri,
      codeVerifier: verifier,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange token');
  }

  const data = await response.json();
  
  if (data.access_token && data.expires_in) {
    memoryAccessToken = data.access_token;
    memoryExpiresAt = Date.now() + data.expires_in * 1000;
  }
  
  // Clear the URL parameters
  window.history.replaceState({}, document.title, '/');
}

export async function refreshAccessToken() {
  try {
    const response = await fetch('/api/spotify/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const data = await response.json();
    if (data.access_token && data.expires_in) {
      memoryAccessToken = data.access_token;
      memoryExpiresAt = Date.now() + data.expires_in * 1000;
      return memoryAccessToken;
    }
    
    return null;
  } catch (error) {
    clearSession();
    return null;
  }
}

export async function getValidAccessToken() {
  if (!memoryAccessToken || !memoryExpiresAt) {
    // If not in memory, try to refresh silently from cookie
    return await refreshAccessToken();
  }

  // If expiring within 1 minute, refresh
  if (Date.now() > memoryExpiresAt - 60000) {
    return await refreshAccessToken();
  }

  return memoryAccessToken;
}
