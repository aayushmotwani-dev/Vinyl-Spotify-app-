import React, { useState, useEffect, useRef } from 'react';
import './Tonearm.css';

interface TonearmProps {
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
  onSeek: (positionMs: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  style?: React.CSSProperties;
  minAngle?: number;
  maxAngle?: number;
  restAngle?: number;
}

function TonearmInner({ 
  progressMs, 
  durationMs, 
  isPlaying, 
  onSeek, 
  onPlay, 
  onPause, 
  onDragStart, 
  onDragEnd, 
  style,
  minAngle = 10,
  maxAngle = 36,
  restAngle = 2
}: TonearmProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragAngle, setDragAngle] = useState(restAngle);
  const pivotRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // DEBUG OVERLAY FLAG
  const DEBUG = false;
  const [debugExpanded, setDebugExpanded] = useState(false);

  useEffect(() => {
    // Only initialize the audio on non-touch devices (desktops).
    // Playing HTML5 audio on iOS/Android steals the OS audio focus,
    // which immediately forces the background Spotify app to pause!
    if (typeof window !== 'undefined' && !('ontouchstart' in window)) {
      audioRef.current = new Audio('/thump.wav');
      audioRef.current.volume = 0.03; // Make the sound very soft
    }
  }, []);

  const prevIsPlaying = useRef(isPlaying);
  useEffect(() => {
    if (isPlaying !== prevIsPlaying.current) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      prevIsPlaying.current = isPlaying;
    }
  }, [isPlaying]);

  let playbackAngle = restAngle;
  if (durationMs > 0) {
    const fraction = progressMs / durationMs;
    // Linear interpolation from minAngle to maxAngle
    playbackAngle = minAngle + fraction * (maxAngle - minAngle);
  }

  // The angle only reads from playback position if NOT dragging.
  const displayAngle = isDragging ? dragAngle : playbackAngle;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragAngle(displayAngle); // Snap drag start to current visual angle
    onDragStart();
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !pivotRef.current) return;
    
    const pivotRect = pivotRef.current.getBoundingClientRect();
    const pivotX = pivotRect.left + pivotRect.width / 2;
    const pivotY = pivotRect.top + pivotRect.height / 2;
    
    const dx = e.clientX - pivotX;
    const dy = e.clientY - pivotY;
    
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
    
    // Normalize angle
    if (angle < -180) angle += 360;
    if (angle > 180) angle -= 360;
    
    // Clamp between max allowed outward (Resting) and max allowed inward (Max)
    angle = Math.max(restAngle, Math.min(maxAngle, angle));
    setDragAngle(angle);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    onDragEnd();
    (e.target as Element).releasePointerCapture(e.pointerId);
    
    // If dropped off the record (close to the rest clip)
    if (dragAngle < restAngle + 5) {
      onPause();
    } else {
      // Calculate fraction.
      const fraction = (dragAngle - minAngle) / (maxAngle - minAngle);
      const clampedFraction = Math.max(0, Math.min(1, fraction));
      const targetMs = Math.round(clampedFraction * durationMs);
      
      onSeek(targetMs);
      if (!isPlaying) {
        onPlay();
      }
    }
  };

  return (
    <>
      {DEBUG && (
        <div style={{
          position: 'fixed', bottom: 10, left: 10, background: 'rgba(0,0,0,0.8)',
          color: '#0f0', padding: '10px', fontFamily: 'monospace', fontSize: '12px',
          zIndex: 9999, textAlign: 'left', border: '1px solid #0f0'
        }}>
          <div 
            onClick={() => setDebugExpanded(!debugExpanded)} 
            style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: debugExpanded ? '5px' : '0', userSelect: 'none' }}
          >
            {debugExpanded ? '▼ DEBUG OVERLAY' : '▶ DEBUG'}
          </div>
          {debugExpanded && (
            <>
              <div>Angle: {displayAngle.toFixed(2)}° (Min: {minAngle}°, Max: {maxAngle}°)</div>
              <div>Source: {isDragging ? "dragging" : "playback"}</div>
              <div>Progress %: {(((displayAngle - minAngle) / (maxAngle - minAngle)) * 100).toFixed(1)}%</div>
              <div>Seek MS: {(Math.max(0, Math.min(1, (displayAngle - minAngle) / (maxAngle - minAngle))) * durationMs).toFixed(0)}</div>
              <div>Duration MS: {durationMs}</div>
              <div>isDragging: {isDragging ? 'true' : 'false'}</div>
            </>
          )}
        </div>
      )}
      <div className="tonearm-container" style={style}>
        {/* Stationary absolute pivot reference */}
        <div ref={pivotRef} style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '1px' }} />
        
        <div 
          className={`tonearm ${isDragging ? 'dragging' : ''} ${!isPlaying || isDragging ? 'lifted' : 'playing'}`}
          style={{ transform: `rotate(${displayAngle}deg)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <svg viewBox="-40 -40 80 340" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="arm-metal" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--tonearm-metal-dark)" />
                <stop offset="50%" stopColor="var(--tonearm-metal-light)" />
                <stop offset="100%" stopColor="var(--tonearm-metal-dark)" />
              </linearGradient>
              <linearGradient id="headshell" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#222" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </linearGradient>
            </defs>
            
            {/* Pivot Base */}
            <circle cx="0" cy="0" r="32" fill="#1f1f1f" stroke="#0f0f0f" strokeWidth="2" className="tonearm-shadow-target" />
            <circle cx="0" cy="0" r="20" fill="#111" />
            <circle cx="0" cy="0" r="8" fill="#888" />
            
            {/* Main Arm */}
            <path d="M -4 0 L -2 297 L 2 297 L 4 0 Z" fill="url(#arm-metal)" className="tonearm-shadow-target" />
            
            {/* Counterweight */}
            <rect x="-16" y="-30" width="32" height="24" rx="4" fill="#1a1a1a" className="tonearm-shadow-target" />
            
            {/* Headshell (Needle part) */}
            <g transform="translate(0, 297) rotate(25)" className="tonearm-shadow-target">
              <rect x="-12" y="-35" width="24" height="45" rx="4" fill="url(#headshell)" />
              <rect x="-4" y="-25" width="8" height="30" rx="2" fill="#333" />
              <circle cx="0" cy="0" r="2" fill="#ff3333" />
            </g>
          </svg>
        </div>
      </div>
    </>
  );
}

export const Tonearm = React.memo(TonearmInner);
