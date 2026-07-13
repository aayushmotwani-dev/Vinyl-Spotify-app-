import { useEffect, useState, useRef, useCallback } from 'react';
import { login, handleCallback, getValidAccessToken } from './auth';
import { useNowPlaying, useTransportControls, getSavedAlbums, getPlaylists, getLikedSongs, getAlbumTracks, getPlaylistTracks, useTrackWear } from './api';
import { Tonearm } from './Tonearm';
import { WheelPickerModal } from './WheelPickerModal';
import { MiniPlayer } from './MiniPlayer';
import { BottomSheet } from './BottomSheet';
import './App.css';

const aesthetics = ['classic', 'clear', 'red', 'blue', 'picture', 'gold', 'splatter', 'cosmic'];

const getAesthetic = (id: string) => {
  if (!id) return 'classic';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return aesthetics[Math.abs(hash) % aesthetics.length];
};

const wearGrades = [
  { label: 'Pristine (No Wear)', opacity: 0 },
  { label: 'Light Wear', opacity: 0.2 },
  { label: 'Medium Wear', opacity: 0.6 },
  { label: 'Heavy Wear', opacity: 1.0 },
];

interface ThemeLayout {
  bgImage?: string;
  aspectRatio?: string;
  platter?: { x: string, y: string, size: string };
  tonearm?: { x: string; y: string; minAngle: number; maxAngle: number; restAngle: number; scale?: number };
  controls?: {
    startStop?: { x: string, y: string, w: string, h: string };
    rpm?: { y: string, x33: string, x45: string, x78: string, r: string };
  }
  lighting?: {
    ambientCast?: string;
    rimLight?: string;
    specularSweep?: string;
  }
}

interface ThemeOption {
  id: string;
  label: string;
  layout?: ThemeLayout;
}

const turntableThemes: ThemeOption[] = [
  { 
    id: 'retro', 
    label: 'RETRO (1970s)',
    layout: {
      bgImage: '/themes/retro.jpg?v=2',
      aspectRatio: '1024 / 667',
      platter: { x: '47.36%', y: '49.48%', size: '44.0%' }, 
      tonearm: { x: '79.0%', y: '29.39%', minAngle: 28.3, maxAngle: 59.2, restAngle: 15 },
      controls: {
        startStop: { x: '23.5%', y: '85.4%', w: '6.5%', h: '7.5%' }
      }
    }
  },
  { 
    id: 'classic', 
    label: 'CLASSIC (Technics SL-1200)',
    layout: {
      bgImage: '/themes/classic.webp',
      aspectRatio: '2424 / 1536',
      platter: { x: '46.62%', y: '48.76%', size: '43.1%' }, 
      tonearm: { x: '78.3%', y: '27.0%', minAngle: 28.0, maxAngle: 59.0, restAngle: 15 }, 
      controls: {
        startStop: { x: '25.23%', y: '85.64%', w: '5.8%', h: '7.1%' }
      }
    }
  },
  { 
    id: 'transparent', 
    label: 'TRANSPARENT (Clear Tech)',
    layout: {
      bgImage: '/themes/transparent.webp',
      aspectRatio: '2448 / 1536',
      platter: { x: '47.43%', y: '48.70%', size: '44.0%' }, 
      tonearm: { x: '78.21%', y: '27.12%', minAngle: 25.8, maxAngle: 56.4, restAngle: 15 }, 
      controls: {
        startStop: { x: '25.59%', y: '85.48%', w: '5.7%', h: '10.3%' }
      }
    }
  },
  { 
    id: 'cyberpunk', 
    label: 'CYBERPUNK (Neo-Tokyo Drift)',
    layout: {
      bgImage: '/themes/cyberpunk.webp',
      aspectRatio: '2359 / 1536',
      platter: { x: '45.27%', y: '48.70%', size: '44.0%' }, 
      tonearm: { x: '78.36%', y: '26.86%', minAngle: 29.5, maxAngle: 64.6, restAngle: 15 }, 
      controls: {
        startStop: { x: '24.31%', y: '85.55%', w: '5.0%', h: '7.9%' }
      },
      lighting: {
        ambientCast: 'radial-gradient(circle, rgba(255, 0, 204, 0.4) 0%, rgba(0, 255, 255, 0.1) 60%, transparent 100%)',
        rimLight: 'inset 0 0 30px rgba(0, 255, 255, 0.5), 0 0 20px rgba(255, 0, 204, 0.4)',
        specularSweep: 'conic-gradient(from 180deg at 50% 50%, transparent 0deg, rgba(0, 255, 255, 0.15) 60deg, rgba(255, 0, 204, 0.25) 180deg, rgba(0, 255, 255, 0.15) 300deg, transparent 360deg)'
      }
    }
  },
  { 
    id: 'neon', 
    label: 'FUTURISTIC (Neon Synth)',
    layout: {
      bgImage: '/themes/neon-synth.webp',
      aspectRatio: '2437 / 1536',
      platter: { x: '48.87%', y: '49.35%', size: '44.0%' }, 
      tonearm: { x: '82.0%', y: '25.0%', minAngle: 28.0, maxAngle: 65.0, restAngle: 20 }, 
      controls: {
        startStop: { x: '25.6%', y: '85.5%', w: '8.3%', h: '10%' }
      },
      lighting: {
        ambientCast: 'radial-gradient(circle, rgba(138, 43, 226, 0.4) 0%, rgba(255, 0, 128, 0.15) 60%, transparent 100%)',
        rimLight: 'inset 0 0 25px rgba(255, 0, 128, 0.6), 0 0 20px rgba(138, 43, 226, 0.5)',
        specularSweep: 'conic-gradient(from 180deg at 50% 50%, transparent 0deg, rgba(255, 0, 128, 0.2) 90deg, rgba(138, 43, 226, 0.3) 180deg, rgba(255, 0, 128, 0.2) 270deg, transparent 360deg)'
      }
    }
  }
];

const pickNextStyle = (currentStyle: string, availableStyles: { id: string }[]) => {
  const others = availableStyles.filter(s => s.id !== currentStyle);
  return others[Math.floor(Math.random() * others.length)].id;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [manualAesthetic, setManualAesthetic] = useState<string | null>(null);
  const { state, refetch, setOptimisticProgress, setOptimisticIsPlaying } = useNowPlaying();
  const [manualWearGrade, setManualWearGrade] = useState<number | null>(null);
  const [shuffleWear, setShuffleWear] = useState(true);
  const { wearGrade: autoWearGrade } = useTrackWear(state?.trackId);
  const wearGrade = shuffleWear ? autoWearGrade : (manualWearGrade ?? 0.6);
  const [currentTheme, setCurrentTheme] = useState('retro');
  const [isCrateOpen, setIsCrateOpen] = useState(false);
  const [shuffleOnTrackChange, setShuffleOnTrackChange] = useState(false);
  const shuffleRef = useRef(shuffleOnTrackChange);

  // Dragging state
  const recordRef = useRef<HTMLDivElement>(null);
  const [isDraggingDisc, setIsDraggingDisc] = useState(false);
  const currentDragAngleRef = useRef(0);
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDesktopFullScreen, setIsDesktopFullScreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsDesktopFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (window.innerWidth > 1024) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    } else {
      setIsFullScreen(!isFullScreen);
    }
  }, [isFullScreen]);

  const [isLightMode, setIsLightMode] = useState(false);
  const [activePicker, setActivePicker] = useState<string | null>(null);
  
  const [collapsedSettings, setCollapsedSettings] = useState({ appearance: false, turntable: false, vinyl: false, wear: false });

  const toggleConfig = useCallback((key: 'appearance' | 'turntable' | 'vinyl' | 'wear') => {
    setCollapsedSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    shuffleRef.current = shuffleOnTrackChange;
  }, [shuffleOnTrackChange]);

  useEffect(() => {
    if (state?.trackId && state?.isPlaying) {
      const trackId = state.trackId;
      const timer = setTimeout(() => {
        const storedPlays = JSON.parse(localStorage.getItem('local_track_plays') || '{}');
        const currentPlays = storedPlays[trackId] || 0;
        storedPlays[trackId] = currentPlays + 1;
        localStorage.setItem('local_track_plays', JSON.stringify(storedPlays));
      }, 15000); // Record a play after 15 seconds of continuous playback
      
      return () => clearTimeout(timer);
    }
  }, [state?.trackId, state?.isPlaying]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'browser' | 'config'>('browser');
  const [activeSubTab, setActiveSubTab] = useState<'albums' | 'playlists'>('albums');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVinylExtracted, setIsVinylExtracted] = useState(false);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [tracklistData, setTracklistData] = useState<any[] | null>(null);


  // Helper for bucketed edge thickness by track count (playlists)
  const getTrackEdgeThickness = (tracks: number) => {
    if (!tracks) return 14; // fallback
    if (tracks < 10) return 8;
    if (tracks <= 30) return 14;
    return 20;
  };

  // Helper for bucketed edge thickness by duration (albums/liked songs)
  const getDurationEdgeThickness = (durationMs: number) => {
    if (!durationMs) return 14; // fallback
    const mins = durationMs / 60000;
    if (mins < 20) return 8;
    if (mins <= 45) return 14;
    return 20;
  };

  const handleTabChange = (tab: 'browser' | 'config') => {
    setActiveTab(tab);
    setActiveIndex(0);
    setIsVinylExtracted(false);
    setTracklistData(null);
  };

  useEffect(() => {
    if (isAuthenticated) {
      getSavedAlbums().then(setAlbums).catch(console.error);
      getPlaylists().then(setPlaylists).catch(console.error);
      getLikedSongs().then(setLikedSongs).catch(console.error);
    }
  }, [isAuthenticated]); // Fetch once authenticated — no need to refetch on play/pause

  const { play, pause, seek, skipToNext, skipToPrevious, playContext, playTracks, toggleShuffle } = useTransportControls(() => refetch());

  const handleSeek = useCallback((positionMs: number) => {
    if (setOptimisticProgress) setOptimisticProgress(positionMs);
    seek(positionMs);
  }, [setOptimisticProgress, seek]);

  // Stable callbacks for MiniPlayer (prevents React.memo invalidation)
  const handlePlayPause = useCallback(() => {
    const nextState = !state?.isPlaying;
    setOptimisticIsPlaying(nextState);
    if (state?.isPlaying) pause(); else play();
    setTimeout(refetch, 1000);
  }, [state?.isPlaying, pause, play, refetch, setOptimisticIsPlaying]);

  const handleSkipNext = useCallback(() => {
    skipToNext(); setTimeout(refetch, 500);
  }, [skipToNext, refetch]);

  const handleSkipPrev = useCallback(() => {
    skipToPrevious(); setTimeout(refetch, 500);
  }, [skipToPrevious, refetch]);

  // Stable callback for BottomSheet toggle
  const handleCrateToggle = useCallback(() => {
    setIsCrateOpen(prev => !prev);
  }, []);

  useEffect(() => {
    if (state?.trackId && shuffleRef.current) {
      setCurrentTheme(prev => pickNextStyle(prev, turntableThemes));
    }
  }, [state?.trackId]);

  useEffect(() => {
    if (window.location.search.includes('code=')) {
      handleCallback().then(() => {
        setIsAuthenticated(true);
        setIsInitializing(false);
      }).catch(err => {
        console.error('Login failed', err);
        setIsInitializing(false);
      });
    } else {
      getValidAccessToken().then(token => {
        setIsAuthenticated(!!token);
        setIsInitializing(false);
      }).catch(() => {
        setIsInitializing(false);
      });
    }
  }, []);

  const handleRecordPointerDown = useCallback((e: React.PointerEvent) => {
    if (!recordRef.current || !state) return;
    const rect = recordRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    currentDragAngleRef.current = angle;
    setIsDraggingDisc(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [state]);

  const handleRecordPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingDisc || !recordRef.current || !state) return;
    const rect = recordRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    let delta = angle - currentDragAngleRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    
    // Roughly 360 degrees = 5 seconds
    const msPerDegree = 5000 / 360;
    const timeDelta = delta * msPerDegree;
    
    currentDragAngleRef.current = angle;
    const newProgress = Math.max(0, Math.min(state.durationMs, state.progressMs + timeDelta));
    if (setOptimisticProgress) setOptimisticProgress(newProgress);
  }, [isDraggingDisc, state, setOptimisticProgress]);

  const handleRecordPointerUp = useCallback((e: React.PointerEvent) => {
    setIsDraggingDisc(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (state) {
      seek(Math.round(state.progressMs));
    }
  }, [state, seek]);

  if (isInitializing) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="container">
        <h1>Vinyl Deck</h1>
        <button onClick={login} className="connect-btn">Connect Spotify</button>
      </div>
    );
  }

  if (!state) return <div className="container">Loading playback state...</div>;



  const rngAesthetic = getAesthetic(state.trackId);
  const aesthetic = manualAesthetic || rngAesthetic;
  const currentThemeData = turntableThemes.find(t => t.id === currentTheme) || turntableThemes[0];
  return (
    <div className={`container theme-${currentTheme} split-layout ${isFullScreen ? 'full-screen-mode' : ''} ${isDesktopFullScreen ? 'desktop-full-screen' : ''} ${isLightMode ? 'light-mode' : ''} ${isCrateOpen ? 'crate-open' : ''}`}>
      <div className="app-header" style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, textAlign: 'left' }}>
        <h1 className="app-title" style={{ margin: 0 }}>{currentThemeData.label}</h1>
        <p className="app-subtitle" style={{ margin: 0, opacity: 0.8 }}></p>
      </div>
<div className="desktop-right-col">
        <div className="ambient-particles">
          <div className="particle p1"></div>
          <div className="particle p2"></div>
          <div className="particle p3"></div>
          <div className="particle p4"></div>
          <div className="particle p5"></div>
        </div>

        <div className="turntable-viewport">
          {/* Explicit Exit Full Screen Button for Desktop */}
          {isDesktopFullScreen && (
            <button 
              className="exit-fullscreen-btn"
              onClick={toggleFullScreen}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
              Exit Full Screen
            </button>
          )}

          {!isDesktopFullScreen && (
            <button 
              className="full-screen-toggle"
              onClick={toggleFullScreen}
              title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isFullScreen ? (
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              )}
            </button>
          )}
          <div 
            className="turntable-chassis"
            style={currentThemeData.layout ? {
              backgroundImage: `url(${currentThemeData.layout.bgImage})`,
              aspectRatio: currentThemeData.layout.aspectRatio,
              '--aspect-ratio-value': currentThemeData.layout.aspectRatio,
              ...(currentThemeData.layout.lighting ? {
                '--ambient-cast': currentThemeData.layout.lighting.ambientCast,
                '--rim-light-shadow': currentThemeData.layout.lighting.rimLight,
                '--specular-sweep': currentThemeData.layout.lighting.specularSweep
              } as React.CSSProperties : {})
            } as React.CSSProperties : undefined}
          >
          {/* Mechanism Overlay */}
          {!currentThemeData.layout && (
            <div className="mechanism-overlay">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="gear-svg">
                <path d="M50 15 A35 35 0 1 0 50 85 A35 35 0 1 0 50 15 Z" fill="none" stroke="var(--tonearm-metal-dark)" strokeWidth="4" strokeDasharray="5 5" className="gear-spin-slow" />
                <circle cx="50" cy="50" r="25" fill="none" stroke="var(--tonearm-metal-light)" strokeWidth="2" className="gear-spin-reverse" />
                <circle cx="50" cy="50" r="10" fill="var(--tonearm-metal-dark)" />
                <circle cx="50" cy="50" r="4" fill="#111" />
              </svg>
            </div>
          )}

          {/* Photorealistic Interactive Controls Overlay */}
          {currentThemeData.layout?.controls && (
            <div className="chassis-controls-overlay">
              {currentThemeData.layout.controls.startStop && (
                <button 
                  className="mapped-btn start-stop-btn"
                  onClick={() => state.isPlaying ? pause() : play()}
                  style={{
                    left: currentThemeData.layout.controls.startStop.x,
                    top: currentThemeData.layout.controls.startStop.y,
                    width: currentThemeData.layout.controls.startStop.w,
                    height: currentThemeData.layout.controls.startStop.h
                  }}
                  title="Start / Stop"
                />
              )}
            </div>
          )}

          <div 
            className="record-container"
            style={currentThemeData.layout?.platter ? {
              position: 'absolute',
              left: currentThemeData.layout.platter.x,
              top: currentThemeData.layout.platter.y,
              width: currentThemeData.layout.platter.size,
              height: 'auto',
              aspectRatio: '1',
              transform: 'translate(-50%, -50%)',
              margin: 0
            } : undefined}
          >
            {/* Only show default CSS platter details if there is no photorealistic layout */}
            {!currentThemeData.layout && (
              <>
                <div className="chassis-platter-well"></div>
                <div className="chassis-platter-ring"></div>
              </>
            )}
            
            {/* If no custom tonearm layout is provided, render it in the old default relative position */}
            {!currentThemeData.layout?.tonearm && (
              <Tonearm 
                progressMs={state.progressMs}
                durationMs={state.durationMs}
                isPlaying={state.isPlaying && !isDraggingDisc}
                onSeek={handleSeek}
                onPlay={play}
                onPause={pause}
                onDragStart={() => {}}
                onDragEnd={() => {}}
              />
            )}
            
            <div 
              ref={recordRef}
              className={`record ${aesthetic} ${isDraggingDisc ? 'dragging' : ''}`}
              onPointerDown={handleRecordPointerDown}
              onPointerMove={handleRecordPointerMove}
              onPointerUp={handleRecordPointerUp}
              onPointerCancel={handleRecordPointerUp}
              style={{ 
                transform: `rotate(${state.progressMs * 0.06}deg)`,
                cursor: isDraggingDisc ? 'grabbing' : 'grab',
                touchAction: 'none',
                ...(aesthetic === 'picture' ? { backgroundImage: `url(${state.albumArtUrl})`, backgroundSize: 'cover' } : {})
              }}
            >
              <div className="record-grooves"></div>
              <div className="record-label" style={{ backgroundImage: `url(${state.albumArtUrl})` }}></div>
              <div className="record-scratches" style={{ opacity: wearGrade }}></div>
            </div>
            <div className="record-glare"></div>
          </div>

          {/* Absolute Tonearm positioning for photorealistic themes */}
          {currentThemeData.layout?.tonearm && (
            <Tonearm 
              progressMs={state.progressMs}
              durationMs={state.durationMs}
              isPlaying={state.isPlaying && !isDraggingDisc}
              onSeek={handleSeek}
              onPlay={play}
              onPause={pause}
              onDragStart={() => {}}
              onDragEnd={() => {}}
              minAngle={currentThemeData.layout.tonearm.minAngle}
              maxAngle={currentThemeData.layout.tonearm.maxAngle}
              restAngle={currentThemeData.layout.tonearm.restAngle}
              style={{
                left: currentThemeData.layout.tonearm.x,
                top: currentThemeData.layout.tonearm.y,
                transform: 'translate(-50%, -10px)',
                right: 'auto',
                touchAction: 'none',
                // Natively scales tonearm width/height along with the chassis via container queries
                '--tonearm-scale': `calc(100cqw / 1024 * ${currentThemeData.layout.tonearm.scale || 1})`
              } as React.CSSProperties}
            />
          )}
          </div>
          
          {/* MINI PLAYER */}
          <div className="mini-player-wrapper">
            <MiniPlayer 
              trackName={state.trackName}
              artistName={state.artistName}
              isPlaying={state.isPlaying}
              onPlayPause={handlePlayPause}
              onSkipNext={handleSkipNext}
              onSkipPrev={handleSkipPrev}
              durationMs={state.durationMs}
              progressMs={state.progressMs}
            />
          </div>
        </div>
      </div>

      {/* THE CRATE SHELF */}
      <BottomSheet isOpen={isCrateOpen} onToggle={handleCrateToggle}>
        <div className={`shelf-section`}>
          <div className="sticky-header">
            <div className="crate-tabs">
            <button 
              className={`crate-tab ${activeTab === 'browser' ? 'active' : ''}`}
              onClick={() => handleTabChange('browser')}
            >
              My Music
            </button>
            <button 
              className={`crate-tab ${activeTab === 'config' ? 'active' : ''}`}
              onClick={() => handleTabChange('config')}
            >
              Config
            </button>
          </div>

          {activeTab === 'browser' && (
            <div className="browser-sub-nav-container">
              <div className="pill-toggle">
                <button 
                  className={`pill-btn ${activeSubTab === 'albums' ? 'active' : ''}`}
                  onClick={() => { setActiveSubTab('albums'); setActiveIndex(0); setIsVinylExtracted(false); }}
                >Albums</button>
                <button 
                  className={`pill-btn ${activeSubTab === 'playlists' ? 'active' : ''}`}
                  onClick={() => { setActiveSubTab('playlists'); setActiveIndex(0); setIsVinylExtracted(false); }}
                >Playlists</button>
              </div>
            </div>
          )}
          </div> {/* End sticky-header */}

          {activeTab === 'config' && (
            <div className="configuration-section" style={{ padding: '1rem', paddingBottom: '3rem' }}>
                <div className="collapsible-config-content">
              <div className="config-group">
                <label onClick={() => toggleConfig('appearance')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none' }}>
                  <span style={{ fontSize: '0.8em', transition: 'transform 0.2s', transform: collapsedSettings.appearance ? 'rotate(-90deg)' : 'rotate(0)' }}>▼</span> Appearance
                </label>
                <div style={{ display: collapsedSettings.appearance ? 'none' : 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setIsLightMode(false)}
                    style={{ flex: 1, padding: '8px', background: !isLightMode ? 'var(--bg-primary)' : 'transparent', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: !isLightMode ? 'var(--text-primary)' : 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer' }}
                  >Dark</button>
                  <button 
                    onClick={() => setIsLightMode(true)}
                    style={{ flex: 1, padding: '8px', background: isLightMode ? 'var(--bg-primary)' : 'transparent', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: isLightMode ? 'var(--text-primary)' : 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer' }}
                  >Light</button>
                </div>
              </div>

              <div className="config-group">
                <label onClick={() => toggleConfig('turntable')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none' }}>
                  <span style={{ fontSize: '0.8em', transition: 'transform 0.2s', transform: collapsedSettings.turntable ? 'rotate(-90deg)' : 'rotate(0)' }}>▼</span> Turntable Style
                </label>
                <div className="custom-select-trigger" onClick={() => setActivePicker('theme')} style={{ display: collapsedSettings.turntable ? 'none' : 'block' }}>
                  {turntableThemes.find(t => t.id === currentTheme)?.label || 'Retro Wood'}
                </div>
              </div>

              <div className="config-group">
                <label onClick={() => toggleConfig('vinyl')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none' }}>
                  <span style={{ fontSize: '0.8em', transition: 'transform 0.2s', transform: collapsedSettings.vinyl ? 'rotate(-90deg)' : 'rotate(0)' }}>▼</span> Vinyl Style
                </label>
                <div className="custom-select-trigger" onClick={() => setActivePicker('vinyl')} style={{ display: collapsedSettings.vinyl ? 'none' : 'block' }}>
                  {manualAesthetic ? manualAesthetic.charAt(0).toUpperCase() + manualAesthetic.slice(1) : `Auto (${rngAesthetic})`}
                </div>
              </div>

              <div className="config-group">
                <label onClick={() => toggleConfig('wear')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none' }}>
                  <span style={{ fontSize: '0.8em', transition: 'transform 0.2s', transform: collapsedSettings.wear ? 'rotate(-90deg)' : 'rotate(0)' }}>▼</span> Wear & Tear
                </label>
                <div className="custom-select-trigger" onClick={() => setActivePicker('wear')} style={{ display: collapsedSettings.wear ? 'none' : 'block' }}>
                  {shuffleWear ? `Auto (${wearGrades.find(w => w.opacity === autoWearGrade)?.label || 'Dynamic'})` : (wearGrades.find(w => w.opacity === manualWearGrade)?.label || 'Medium Wear')}
                </div>
              </div>

              <WheelPickerModal 
                isOpen={activePicker === 'theme'}
                onClose={() => setActivePicker(null)}
                title="Select Turntable Style"
                value={currentTheme}
                onChange={setCurrentTheme}
                options={turntableThemes.map(t => ({ label: t.label, value: t.id }))}
              />

              <WheelPickerModal 
                isOpen={activePicker === 'vinyl'}
                onClose={() => setActivePicker(null)}
                title="Select Vinyl Style"
                value={manualAesthetic || 'auto'}
                onChange={(val) => setManualAesthetic(val === 'auto' ? null : val)}
                options={[
                  { label: `Auto (${rngAesthetic})`, value: 'auto' },
                  ...aesthetics.map(a => ({ label: a.charAt(0).toUpperCase() + a.slice(1), value: a }))
                ]}
              />

              <WheelPickerModal 
                isOpen={activePicker === 'wear'}
                onClose={() => setActivePicker(null)}
                title="Select Wear & Tear"
                value={shuffleWear ? 'auto' : (manualWearGrade?.toString() || '0.6')}
                onChange={(val) => {
                  if (val === 'auto') {
                    setShuffleWear(true);
                  } else {
                    setShuffleWear(false);
                    setManualWearGrade(Number(val));
                  }
                }}
                options={[
                  { label: 'Auto (Spotify History)', value: 'auto' },
                  ...wearGrades.map(g => ({ label: g.label, value: g.opacity.toString() }))
                ]}
              />

              <div className="checkbox-row" style={{ marginBottom: '8px' }}>
                <button className="transport-btn shuffle-btn" onClick={() => setShuffleWear(!shuffleWear)} style={{ color: shuffleWear ? '#e5b07b' : '' }}>
                  Shuffle Wear
                </button>
                <label className="checkbox-label">
                  <input type="checkbox" checked={shuffleWear} onChange={e => setShuffleWear(e.target.checked)} />
                  AUTO-UPDATE WEAR
                </label>
              </div>

              <div className="checkbox-row">
                <button className="transport-btn shuffle-btn" onClick={() => setShuffleOnTrackChange(!shuffleOnTrackChange)} style={{ color: shuffleOnTrackChange ? '#e5b07b' : '' }}>
                  Shuffle
                </button>
                <label className="checkbox-label">
                  <input type="checkbox" checked={shuffleOnTrackChange} onChange={e => setShuffleOnTrackChange(e.target.checked)} />
                  SHUFFLE ON CHANGE
                </label>
              </div>
              
              <div className="device-output-row transport-btn" style={{ height: 'auto', padding: '0.8rem', marginTop: '1rem', flexDirection: 'row', justifyContent: 'flex-start', gap: '1rem' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#e5b07b' }}>Device Output</span>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{state.deviceName ? state.deviceName : 'Ready to play'}</span>
                </div>
              </div>
                </div>
              </div>

            )}

          {activeTab === 'browser' && (
            <div className="crate-container">
              <>
            {activeSubTab === 'albums' && (
            albums.length > 0 ? albums.map((album, idx) => {
              const isActive = idx === activeIndex;
              const edgeThickness = getDurationEdgeThickness(album.total_duration_ms);
              return (
                <div 
                  key={idx} 
                  className={`crate-item-wrapper ${isActive ? 'active' : ''} ${isActive && isVinylExtracted ? 'extracted' : ''}`}
                  onClick={() => {
                    if (activeIndex === idx) {
                      setIsVinylExtracted(!isVinylExtracted);
                    } else {
                      setActiveIndex(idx);
                      setIsVinylExtracted(false);
                      setTracklistData(null);
                    }
                  }}
                >
                  <div className="crate-hover-label">{album.name}</div>
                  <div className="crate-item-visuals">
                    <div 
                      className={`crate-vinyl ${isActive && isVinylExtracted ? 'extracted' : ''}`} 
                      onClick={(e) => {
                        if (isActive && isVinylExtracted) {
                          e.stopPropagation();
                          if (album.uri) playContext(album.uri);
                        }
                      }}
                    >
                      <div className="crate-vinyl-label" style={{ backgroundImage: album.image ? `url(${album.image})` : 'none' }}></div>
                    </div>
                    <div className="crate-face" style={{ width: isActive ? '150px' : '0px', height: isActive ? '150px' : '130px' }}>
                      <img src={album.image || ''} className={`crate-face-image ${!album.image ? 'placeholder' : ''}`} alt="" draggable="false" />
                    </div>
                    <div className="crate-edge" style={{ 
                      width: `${edgeThickness}px`, 
                      height: isActive ? '150px' : '130px',
                      backgroundImage: album.image ? `url(${album.image})` : 'none'
                    }}></div>
                  </div>
                </div>
              );
            }) : (
              Array(20).fill(0).map((_, idx) => (
                <div key={idx} className="crate-item skeleton">
                  <div className="crate-edge" style={{ width: '12px', height: '130px', opacity: 0.6 }}></div>
                </div>
              ))
            )
          )}

          {activeSubTab === 'playlists' && (
            <>
              {/* Pinned Liked Songs */}
              {(() => {
                const likedSongsDuration = likedSongs.reduce((sum, t) => sum + (t.duration_ms || 0), 0);
                const likedSongsThickness = getDurationEdgeThickness(likedSongsDuration);
                return (
                  <div 
                    className={`crate-item-wrapper ${activeIndex === 0 ? 'active' : ''} ${activeIndex === 0 && isVinylExtracted ? 'extracted' : ''}`}
                    onClick={() => {
                      if (activeIndex === 0) {
                        setIsVinylExtracted(!isVinylExtracted);
                      } else {
                        setActiveIndex(0);
                        setIsVinylExtracted(false);
                        setTracklistData(null);
                      }
                    }}
                  >
                    <div className="crate-hover-label">Liked Songs</div>
                    <div className="crate-item-visuals">
                      <div 
                        className={`crate-vinyl ${activeIndex === 0 && isVinylExtracted ? 'extracted' : ''}`} 
                        onClick={(e) => {
                          if (activeIndex === 0 && isVinylExtracted) {
                            e.stopPropagation();
                            playTracks(likedSongs.map(t => t.uri));
                          }
                        }}
                      >
                        <div className="crate-vinyl-label" style={{ background: 'linear-gradient(135deg, #450af5, #c4efd9)' }}></div>
                      </div>
                      <div className="crate-face" style={{ width: activeIndex === 0 ? '150px' : '0px', height: activeIndex === 0 ? '150px' : '130px' }}>
                        <div className="liked-songs-background">
                          <svg className="liked-songs-icon" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </div>
                      </div>
                      <div className="crate-edge liked-songs-edge" style={{ width: `${likedSongsThickness}px`, height: activeIndex === 0 ? '150px' : '130px', opacity: activeIndex === 0 ? 1 : 0.6 }}></div>
                    </div>
                  </div>
                );
              })()}

              {/* Real Playlists */}
              {playlists.length > 0 ? playlists.map((playlist, idx) => {
                const globalIdx = idx + 1; // offset by 1 for Liked Songs
                const isActive = globalIdx === activeIndex;
                const edgeThickness = getTrackEdgeThickness(playlist.total_tracks);
                return (
                  <div 
                    key={globalIdx} 
                    className={`crate-item-wrapper ${isActive ? 'active' : ''} ${isActive && isVinylExtracted ? 'extracted' : ''}`}
                    onClick={() => {
                      if (activeIndex === globalIdx) {
                        setIsVinylExtracted(!isVinylExtracted);
                      } else {
                        setActiveIndex(globalIdx);
                        setIsVinylExtracted(false);
                        setTracklistData(null);
                      }
                    }}
                  >
                    <div className="crate-hover-label">{playlist.name}</div>
                    <div className="crate-item-visuals">
                      <div 
                        className={`crate-vinyl ${isActive && isVinylExtracted ? 'extracted' : ''}`} 
                        onClick={(e) => {
                          if (isActive && isVinylExtracted) {
                            e.stopPropagation();
                            if (playlist.uri) playContext(playlist.uri);
                          }
                        }}
                      >
                        <div className="crate-vinyl-label" style={{ backgroundImage: playlist.image ? `url(${playlist.image})` : 'none' }}></div>
                      </div>
                      <div className="crate-face" style={{ width: isActive ? '150px' : '0px', height: isActive ? '150px' : '130px' }}>
                        {playlist.image ? (
                          <img src={playlist.image} alt={playlist.name} className="crate-face-image" />
                        ) : (
                          <div className="crate-face-image placeholder"></div>
                        )}
                      </div>
                      <div className="crate-edge" style={{ 
                        width: `${edgeThickness}px`, 
                        height: isActive ? '150px' : '130px', 
                        opacity: isActive ? 1 : 0.6,
                        backgroundImage: playlist.image ? `url(${playlist.image})` : 'none'
                      }}></div>
                    </div>
                  </div>
                );
              }) : (
                Array(19).fill(0).map((_, idx) => (
                  <div key={idx + 1} className="crate-item skeleton">
                    <div className="crate-edge" style={{ width: '12px', height: '130px', opacity: 0.6 }}></div>
                  </div>
                ))
              )}
            </>
          )}
              </>
            </div>
          )}

        {/* INFO PANEL */}
        {activeTab === 'browser' && ((activeSubTab === 'albums' && albums.length > 0) || (activeSubTab === 'playlists' && (likedSongs.length > 0 || playlists.length > 0))) && (
          <div className="crate-info-panel">
            <div className="crate-info-title">
              {activeSubTab === 'albums' && albums[activeIndex]?.name}
              {activeSubTab === 'playlists' && (activeIndex === 0 ? "Liked Songs" : playlists[activeIndex - 1]?.name)}
            </div>
            <div className="crate-info-subtitle">
              {activeSubTab === 'albums' && albums[activeIndex]?.artist}
              {activeSubTab === 'playlists' && (activeIndex === 0 ? `${likedSongs.length} tracks` : playlists[activeIndex - 1]?.owner)}
            </div>
            
            <div className="crate-info-actions">
              <button 
                className="crate-btn"
                onClick={async () => {
                  if (activeSubTab === 'albums') {
                    await playContext(albums[activeIndex].uri);
                  } else {
                    if (activeIndex === 0) await playTracks(likedSongs.map(t => t.uri));
                    else await playContext(playlists[activeIndex - 1].uri);
                  }
                }}
              >
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                Play
              </button>
              
              <button 
                className={`crate-btn ${isShuffleOn ? 'active' : ''}`}
                onClick={async () => {
                  const newShuffleState = !isShuffleOn;
                  setIsShuffleOn(newShuffleState);
                  await toggleShuffle(newShuffleState);
                  if (activeSubTab === 'albums') {
                    await playContext(albums[activeIndex].uri);
                  } else {
                    if (activeIndex === 0) await playTracks(likedSongs.map(t => t.uri));
                    else await playContext(playlists[activeIndex - 1].uri);
                  }
                }}
              >
                <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
                Shuffle
              </button>

              <button 
                className={`crate-btn ${tracklistData ? 'active' : ''}`}
                onClick={async () => {
                  if (tracklistData) {
                    setTracklistData(null);
                  } else {
                    if (activeSubTab === 'albums') {
                      const tracks = await getAlbumTracks(albums[activeIndex].id);
                      setTracklistData(tracks);
                    } else if (activeSubTab === 'playlists') {
                      if (activeIndex === 0) setTracklistData(likedSongs);
                      else {
                        const tracks = await getPlaylistTracks(playlists[activeIndex - 1].id);
                        setTracklistData(tracks);
                      }
                    }
                  }
                }}
              >
                <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
                Tracklist
              </button>
            </div>

            {/* TRACKLIST EXPANSION */}
            {tracklistData && (
              <div className="crate-tracklist">
                {tracklistData.map((track, idx) => {
                  const minutes = Math.floor(track.duration_ms / 60000);
                  const seconds = ((track.duration_ms % 60000) / 1000).toFixed(0);
                  const durationStr = `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
                  return (
                    <div 
                      key={track.id || idx} 
                      className="crate-track-row"
                      onClick={() => {
                        if (activeSubTab === 'albums' && albums[activeIndex]?.uri) {
                          playContext(albums[activeIndex].uri, track.uri);
                        } else if (activeSubTab === 'playlists') {
                          if (activeIndex === 0) {
                            playTracks(likedSongs.map(t => t.uri), track.uri);
                          } else if (playlists[activeIndex - 1]?.uri) {
                            playContext(playlists[activeIndex - 1].uri, track.uri);
                          }
                        }
                      }}
                    >
                      <div className="crate-track-left">
                        <span className="crate-track-num">{idx + 1}.</span>
                        <span className="crate-track-name">{track.name}</span>
                      </div>
                      <span className="crate-track-dur">{durationStr}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      </BottomSheet>
    </div>
  );
}

export default App;
