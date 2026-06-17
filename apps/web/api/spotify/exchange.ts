import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code, codeVerifier, redirectUri } = req.body || {};

  if (!code || !codeVerifier || !redirectUri) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'SPOTIFY_CLIENT_ID environment variable is missing' });
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any;
      return res.status(response.status).json(errorData);
    }

    const data = (await response.json()) as any;
    
    // Set the refresh token as an HttpOnly cookie
    if (data.refresh_token) {
      const isDev = process.env.NODE_ENV === 'development';
      const cookie = `spotify_refresh_token=${data.refresh_token}; HttpOnly; Path=/api/spotify; SameSite=Strict${!isDev ? '; Secure' : ''}`;
      res.setHeader('Set-Cookie', cookie);
    }

    // Only return the access token and expiry to the client
    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
