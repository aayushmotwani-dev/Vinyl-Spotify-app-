import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import './MiniPlayer.css';

const MarqueeText = ({ children, className }: { children: ReactNode, className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };
    
    // Check initially and whenever children change
    checkOverflow();
    
    // Add resize listener in case container size changes
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  return (
    <div ref={containerRef} className={`marquee-container ${className || ''}`}>
      <div ref={textRef} className={`marquee-content ${isOverflowing ? 'animate' : ''}`}>
        {children}
      </div>
      {isOverflowing && (
        <div className="marquee-content animate" aria-hidden="true">
          {children}
        </div>
      )}
    </div>
  );
};

interface MiniPlayerProps {
  trackName?: string;
  artistName?: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
  durationMs: number;
  progressMs: number;
}

function MiniPlayerInner({ trackName, artistName, isPlaying, onPlayPause, onSkipNext, onSkipPrev, durationMs, progressMs }: MiniPlayerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const formatTime = (ms: number) => {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isCollapsed) {
    return (
      <div className="miniplayer-chassis collapsed">
        <button onClick={() => setIsCollapsed(false)} className="hardware-button" aria-label="Expand Player" title="Expand Player">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="miniplayer-chassis">
      {/* Signature Detail: Analog LED Indicator */}
      <div className={`miniplayer-led ${isPlaying ? 'active' : ''}`} title="Playback Status" />
      
      <div className="miniplayer-bezel">
        <div className="miniplayer-readout">
          <MarqueeText className="readout-text track">{trackName || "NO DISC"}</MarqueeText>
          <MarqueeText className="readout-text artist">{artistName || "SYSTEM STANDBY"}</MarqueeText>
          <div className="readout-time">
            {formatTime(progressMs)} / {formatTime(durationMs)}
          </div>
        </div>
      </div>
      
      <div className="miniplayer-controls">
        <button onClick={onSkipPrev} className="hardware-button" aria-label="Previous Track">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button onClick={onPlayPause} className="hardware-button play-btn" aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? (
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        <button onClick={onSkipNext} className="hardware-button" aria-label="Next Track">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
        
        {/* Collapse Button */}
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        <button onClick={() => setIsCollapsed(true)} className="hardware-button" aria-label="Collapse Player" title="Collapse Player" style={{ width: '28px' }}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>
        </button>
      </div>
    </div>
  );
}

export const MiniPlayer = React.memo(MiniPlayerInner);
