import { useState } from 'react';
import { getLastPosition } from '../utils/storage';

export default function SplashScreen({ onEnter, onContinue, theme, light }) {
  const [exiting, setExiting] = useState(false);
  const lastPosition = getLastPosition();

  const handleEnter = (continueReading = false) => {
    setExiting(true);
    setTimeout(() => {
      if (continueReading && lastPosition) {
        onContinue(lastPosition);
      } else {
        onEnter();
      }
    }, 700);
  };

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center z-50 ${
        exiting ? 'splash-exit' : 'splash-enter'
      }`}
      style={{ backgroundColor: theme.bg }}
    >
      {/* Ambient glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ backgroundColor: `${theme.accent}0d` }} />

      {/* Title */}
      <div className="relative z-10 text-center">
        <h1 className="font-torah text-6xl md:text-8xl mb-4 tracking-wide"
          style={{ color: theme.accent }}>
          קורא תורה
        </h1>
        <p className="text-lg font-ui mb-12" style={{ color: `${theme.text}66` }}>
          חווית קריאה אינטראקטיבית
        </p>

        {/* Enter button */}
        <button
          onClick={() => handleEnter(false)}
          className="group relative px-12 py-4 bg-transparent border rounded-lg text-xl font-ui
                     transition-all duration-500 cursor-pointer"
          style={{
            borderColor: `${theme.accent}4d`,
            color: theme.accent,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${theme.accent}99`;
            e.currentTarget.style.boxShadow = `0 0 40px ${theme.accent}26`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `${theme.accent}4d`;
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span className="relative z-10">התחל לקרוא</span>
        </button>

        {/* Continue reading */}
        {lastPosition && (
          <div className="mt-6 fade-in">
            <button
              onClick={() => handleEnter(true)}
              className="text-sm transition-colors duration-300 cursor-pointer"
              style={{ color: `${theme.text}4d` }}
              onMouseEnter={(e) => { e.currentTarget.style.color = `${theme.accent}b3`; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = `${theme.text}4d`; }}
            >
              המשך מאיפה שהפסקת — {lastPosition.bookHebrew} פרק {lastPosition.chapter}
            </button>
          </div>
        )}
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-12 w-32 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${theme.accent}4d, transparent)` }} />
    </div>
  );
}
