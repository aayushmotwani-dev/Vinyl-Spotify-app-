import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const cookies = req.headers.cookie;
  if (!cookies) {
    return res.status(401).json({ error: 'missing_refresh_token' });
  }

  // Parse cookies
  const cookieMap = Object.fromEntries(
    cookies.split('; ').map((c) => {
      const parts = c.split('=');
      return [parts[0], parts.slice(1).join('=')];
    })
  );

  const refreshToken = cookieMap['spotify_refresh_token'];
  if (!refreshToken) {
    return res.status(401).json({ error: 'missing_refresh_token' });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'SPOTIFY_CLIENT_ID environment variable is missing' });
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
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
      // If the refresh token is invalid (invalid_grant), clear the cookie
      if (errorData.error === 'invalid_grant') {
        const isDev = process.env.NODE_ENV === 'development';
        res.setHeader('Set-Cookie', `spotify_refresh_token=; HttpOnly; Path=/api/spotify; SameSite=Strict; Max-Age=0${!isDev ? '; Secure' : ''}`);
      }
      return res.status(401).json(errorData);
    }

    const data = (await response.json()) as any;
    
    // Rotate the refresh token if a new one is provided
    if (data.refresh_token) {
      const isDev = process.env.NODE_ENV === 'development';
      const cookie = `spotify_refresh_token=${data.refresh_token}; HttpOnly; Path=/api/spotify; SameSite=Strict${!isDev ? '; Secure' : ''}`;
      res.setHeader('Set-Cookie', cookie);
    }

    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
