import { useState, useEffect } from 'react';

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect touch device
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsMobile(touch);
    if (touch) return;

    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  if (isMobile) return null;

  return (
    <img
      src="/cursor-yad.png"
      alt=""
      style={{
        position: 'fixed',
        left: pos.x - 145,
        top: pos.y - 16,
        width: 320,
        height: 320,
        pointerEvents: 'none',
        transform: 'rotate(-2.5deg)',
        transformOrigin: '145px 16px',
        zIndex: 99999,
      }}
    />
  );
}
