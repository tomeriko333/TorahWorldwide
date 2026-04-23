import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const ref = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsMobile(touch);
    if (touch) return;

    let x = -999;
    let y = -999;
    let pending = false;

    const render = () => {
      pending = false;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${x - 145}px, ${y - 16}px, 0) rotate(-2.5deg)`;
      }
    };

    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!pending) {
        pending = true;
        requestAnimationFrame(render);
      }
    };

    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, []);

  if (isMobile) return null;

  return (
    <img
      ref={ref}
      src="/cursor-yad.png"
      alt=""
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 320,
        height: 320,
        pointerEvents: 'none',
        transform: 'translate3d(-999px, -999px, 0) rotate(-2.5deg)',
        transformOrigin: '145px 16px',
        zIndex: 99999,
        willChange: 'transform',
      }}
    />
  );
}
