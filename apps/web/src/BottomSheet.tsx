import React from 'react';
import './BottomSheet.css';

interface BottomSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function BottomSheetInner({ children, isOpen, onToggle }: BottomSheetProps) {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && <div className="bottom-sheet-backdrop" onClick={onToggle} />}
      
      <div className={`bottom-sheet-tray ${isOpen ? 'open' : ''}`}>
        <div 
          className="tray-handle" 
          onClick={onToggle}
          role="button"
          aria-label="Toggle record crate"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        >
          <div className="handle-texture" />
          <span className="handle-label">RECORD CRATE</span>
          <span className="handle-chevron">{isOpen ? '▼' : '▲'}</span>
        </div>
        <div className="tray-content">
          {children}
        </div>
      </div>
    </>
  );
}

export const BottomSheet = React.memo(BottomSheetInner);
