import { useState, useEffect, useRef, useCallback } from 'react';
import { getValidAccessToken } from './auth';

export interface NowPlayingState {
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
  trackId: string;
  trackName: string;
  artistName: string;
  albumArtUrl: string;
  deviceName: string | null;
  nothingPlaying: boolean;
}

export function useNowPlaying() {
  const [state, setState] = useState<NowPlayingState | null>(null);
  const progressRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const lastUpdateRef = useRef<number>(Date.now());
  const requestRef = useRef<number>(0);
  const lastSeekTimeRef = useRef<number>(0);

  const setOptimisticProgress = useCallback((newProgressMs: number) => {
    progressRef.current = newProgressMs;
    lastUpdateRef.current = Date.now();
    lastSeekTimeRef.current = Date.now();
    setState(prev => prev ? { ...prev, progressMs: newProgressMs } : prev);
  }, []);

  const setOptimisticIsPlaying = useCallback((isPlaying: boolean) => {
    isPlayingRef.current = isPlaying;
    lastUpdateRef.current = Date.now();
    lastSeekTimeRef.current = Date.now();
    setState(prev => prev ? { ...prev, isPlaying } : prev);
  }, []);

  const fetchPlayerState = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) return;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 204) {
        // Nothing playing
        setState((prev) => prev ? {
          ...prev,
          nothingPlaying: true,
          isPlaying: false,
        } : null);
        isPlayingRef.current = false;
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch player state');

      const data = await response.json();
      
      if (!data || !data.item) {
        setState((prev) => prev ? {
          ...prev,
          nothingPlaying: true,
          isPlaying: false,
        } : null);
        isPlayingRef.current = false;
        return;
      }

      const progress = data.progress_ms || 0;
      const isPlaying = data.is_playing;
      
      // If we just sought within the last 3.5 seconds, ignore stale server progress
      if (Date.now() - lastSeekTimeRef.current < 3500) {
        isPlayingRef.current = isPlaying;
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            isPlaying,
            durationMs: data.item.duration_ms,
            trackId: data.item.id || data.item.uri,
            trackName: data.item.name,
            artistName: data.item.artists.map((a: any) => a.name).join(', '),
            albumArtUrl: data.item.album?.images?.[0]?.url || '',
            deviceName: data.device?.name || null,
            nothingPlaying: false,
          };
        });
        return;
      }

      progressRef.current = progress;
      isPlayingRef.current = isPlaying;
      lastUpdateRef.current = Date.now();

      const currentDeviceId = data.device?.id;
      if (currentDeviceId) {
        localStorage.setItem('last_spotify_device_id', currentDeviceId);
      }

      setState({
        isPlaying,
        progressMs: progress,
        durationMs: data.item.duration_ms,
        trackId: data.item.id || data.item.uri,
        trackName: data.item.name,
        artistName: data.item.artists.map((a: any) => a.name).join(', '),
        albumArtUrl: data.item.album?.images?.[0]?.url || '',
        deviceName: data.device?.name || null,
        nothingPlaying: false,
      });

    } catch (e) {
      console.error(e);
    }
  }, []);

  // Polling effect (every 3 seconds)
  useEffect(() => {
    fetchPlayerState();
    const intervalId = setInterval(fetchPlayerState, 3000);
    return () => clearInterval(intervalId);
  }, [fetchPlayerState]);

  // requestAnimationFrame effect for smooth progress updates
  // Throttled to ~30fps to reduce React reconciliation overhead
  const lastStateUpdateRef = useRef<number>(0);
  useEffect(() => {
    const animate = () => {
      if (isPlayingRef.current) {
        const now = Date.now();
        const delta = now - lastUpdateRef.current;
        const newProgress = progressRef.current + delta;
        
        // Only push to React state every ~33ms (≈30fps)
        // The record CSS rotation still runs at 60fps via the compositor
        if (now - lastStateUpdateRef.current >= 33) {
          lastStateUpdateRef.current = now;
          setState((prev) => {
            if (!prev || prev.nothingPlaying) return prev;
            return { ...prev, progressMs: newProgress };
          });
        }
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  return { state, refetch: fetchPlayerState, setOptimisticProgress, setOptimisticIsPlaying };
}

export function useTransportControls(onNoDevice?: () => void) {
  const putCommand = useCallback(async (endpoint: string, params: Record<string, string> = {}) => {
    const token = await getValidAccessToken();
    if (!token) return;

    const url = new URL(`https://api.spotify.com/v1/me/player/${endpoint}`);
    const lastDeviceId = localStorage.getItem('last_spotify_device_id');
    if (lastDeviceId && !params.device_id) {
      url.searchParams.append('device_id', lastDeviceId);
    }
    
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 404) {
      if (onNoDevice) onNoDevice();
      else alert('No active device found on Spotify. Please open Spotify on your phone or laptop and play a track first.');
    } else if (!response.ok && response.status !== 204) {
      console.error(`Failed to execute ${endpoint}`);
    }
  }, [onNoDevice]);

  const postCommand = useCallback(async (endpoint: string, params: Record<string, string> = {}) => {
    const token = await getValidAccessToken();
    if (!token) return;

    const url = new URL(`https://api.spotify.com/v1/me/player/${endpoint}`);
    const lastDeviceId = localStorage.getItem('last_spotify_device_id');
    if (lastDeviceId && !params.device_id) {
      url.searchParams.append('device_id', lastDeviceId);
    }

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 404) {
      if (onNoDevice) onNoDevice();
      else alert('No active device found on Spotify. Please open Spotify on your phone or laptop and play a track first.');
    } else if (!response.ok && response.status !== 204) {
      console.error(`Failed to execute ${endpoint}`);
    }
  }, [onNoDevice]);

  const play = useCallback(() => putCommand('play'), [putCommand]);
  const pause = useCallback(() => putCommand('pause'), [putCommand]);
  const seek = useCallback((positionMs: number) => putCommand('seek', { position_ms: positionMs.toString() }), [putCommand]);
  const skipToNext = useCallback(() => postCommand('next'), [postCommand]);
  const skipToPrevious = useCallback(() => postCommand('previous'), [postCommand]);

  const playContext = useCallback(async (context_uri: string, track_uri?: string) => {
    const token = await getValidAccessToken();
    if (!token) return;
    
    const body: any = { context_uri };
    if (track_uri) {
      body.offset = { uri: track_uri };
    }

    const lastDeviceId = localStorage.getItem('last_spotify_device_id');
    const url = lastDeviceId 
      ? `https://api.spotify.com/v1/me/player/play?device_id=${lastDeviceId}`
      : 'https://api.spotify.com/v1/me/player/play';

    const response = await fetch(url, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.status === 404) {
      if (onNoDevice) onNoDevice();
      else alert('No active device found on Spotify. Please open Spotify on your phone or laptop and play a track first.');
    } else if (!response.ok && response.status !== 204) {
      console.error('Failed to play context');
    }
  }, [onNoDevice]);

  const playTracks = useCallback(async (uris: string[], track_uri?: string) => {
    const token = await getValidAccessToken();
    if (!token) return;
    
    const body: any = { uris };
    if (track_uri) {
      body.offset = { uri: track_uri };
    }

    const lastDeviceId = localStorage.getItem('last_spotify_device_id');
    const url = lastDeviceId 
      ? `https://api.spotify.com/v1/me/player/play?device_id=${lastDeviceId}`
      : 'https://api.spotify.com/v1/me/player/play';

    const response = await fetch(url, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.status === 404) {
      if (onNoDevice) onNoDevice();
      else alert('No active device found on Spotify. Please open Spotify on your phone or laptop and play a track first.');
    } else if (!response.ok && response.status !== 204) {
      console.error('Failed to play tracks');
    }
  }, [onNoDevice]);

  const toggleShuffle = useCallback(async (state: boolean) => {
    const token = await getValidAccessToken();
    if (!token) return;
    
    await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${state}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
  }, []);

  return { play, pause, seek, skipToNext, skipToPrevious, playContext, playTracks, toggleShuffle };
}

export async function getSavedAlbums() {
  const token = await getValidAccessToken();
  if (!token) return [];
  const res = await fetch('https://api.spotify.com/v1/me/albums?limit=50', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (data.items && data.items.length > 0) {
    // Diagnostic logging removed for performance
  }
  return data.items.map((item: any) => ({
    id: item.album.id,
    uri: item.album.uri,
    name: item.album.name,
    artist: item.album.artists.map((a: any) => a.name).join(', '),
    image: item.album.images?.[0]?.url || '',
    total_tracks: item.album.total_tracks || 0,
    total_duration_ms: item.album.tracks?.items?.reduce((sum: number, t: any) => sum + (t.duration_ms || 0), 0) || 0
  }));
}

export async function getPlaylists() {
  const token = await getValidAccessToken();
  if (!token) return [];
  const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items.map((item: any) => ({
    id: item.id,
    uri: item.uri,
    name: item.name,
    owner: item.owner.display_name,
    image: item.images?.[0]?.url || '',
    total_tracks: item.tracks?.total || 0
  }));
}

export async function getLikedSongs() {
  const token = await getValidAccessToken();
  if (!token) return [];
  const res = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items.map((item: any) => ({
    id: item.track.id,
    uri: item.track.uri,
    name: item.track.name,
    duration_ms: item.track.duration_ms
  }));
}

export async function getAlbumTracks(id: string) {
  const token = await getValidAccessToken();
  if (!token) return [];
  const res = await fetch(`https://api.spotify.com/v1/albums/${id}/tracks?limit=50`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items.map((track: any) => ({
    id: track.id,
    uri: track.uri,
    name: track.name,
    duration_ms: track.duration_ms
  }));
}

export async function getPlaylistTracks(id: string) {
  const token = await getValidAccessToken();
  if (!token) return [];
  const res = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=50`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items.map((item: any) => ({
    id: item.track.id,
    uri: item.track.uri,
    name: item.track.name,
    duration_ms: item.track.duration_ms
  }));
}

export async function getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term') {
  const token = await getValidAccessToken();
  if (!token) return [];
  const res = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items.map((item: any) => item.id);
}

export function useTrackWear(trackId?: string) {
  const [baseWear, setBaseWear] = useState<number>(0);
  const [localWear, setLocalWear] = useState<number>(0);
  const [topTracks, setTopTracks] = useState<{ long: string[], medium: string[], short: string[] } | null>(null);

  useEffect(() => {
    async function fetchTop() {
      const cached = localStorage.getItem('spotify_top_tracks');
      if (cached) {
        setTopTracks(JSON.parse(cached));
      }
      
      try {
        const [long, medium, short] = await Promise.all([
          getTopTracks('long_term'),
          getTopTracks('medium_term'),
          getTopTracks('short_term')
        ]);
        const fresh = { long, medium, short };
        setTopTracks(fresh);
        localStorage.setItem('spotify_top_tracks', JSON.stringify(fresh));
      } catch (e) {
        console.error('Failed to fetch top tracks for wear data', e);
      }
    }
    fetchTop();
  }, []);

  useEffect(() => {
    if (!trackId || !topTracks) {
      setBaseWear(0);
      return;
    }

    let newBaseWear = 0;
    const longIndex = topTracks.long.indexOf(trackId);
    const medIndex = topTracks.medium.indexOf(trackId);
    const shortIndex = topTracks.short.indexOf(trackId);

    if (longIndex !== -1) {
      newBaseWear = Math.max(0.4, 1.0 - (longIndex / 50) * 0.6);
    } else if (medIndex !== -1) {
      newBaseWear = Math.max(0.2, 0.6 - (medIndex / 50) * 0.4);
    } else if (shortIndex !== -1) {
      newBaseWear = Math.max(0.1, 0.4 - (shortIndex / 50) * 0.3);
    }
    
    setBaseWear(newBaseWear);
  }, [trackId, topTracks]);

  useEffect(() => {
    if (!trackId) return;
    const storedPlays = JSON.parse(localStorage.getItem('local_track_plays') || '{}');
    const plays = storedPlays[trackId] || 0;
    
    const addedWear = Math.min(0.5, plays * 0.05);
    setLocalWear(addedWear);
  }, [trackId]);

  return { wearGrade: Math.min(1.0, baseWear + localWear) };
}
