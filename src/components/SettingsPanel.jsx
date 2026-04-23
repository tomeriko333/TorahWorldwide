import { createPortal } from 'react-dom';

const GOLD = '#d4a843';

const Icon = {
  Speed: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14a2 2 0 1 0 2-2" />
      <path d="M3 12a9 9 0 0 1 14.4-7.2" />
      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.8-4.5" />
      <path d="M12 3v2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
    </svg>
  ),
  Borders: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4v16" />
      <path d="M19 4v16" />
      <path d="M9 12h6" />
      <path d="M11 9l-2 3 2 3" />
      <path d="M13 9l2 3-2 3" />
    </svg>
  ),
  Aleph: ({ size = 20 }) => (
    <span
      style={{
        fontSize: `${size}px`,
        lineHeight: 1,
        color: GOLD,
        fontFamily: "'TrashimCLM', 'Frank Ruhl Libre', serif",
        fontWeight: 500,
        transform: 'translateY(-1px)',
      }}
    >א</span>
  ),
  Lines: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h10" />
    </svg>
  ),
  Keyboard: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h.01" />
      <path d="M11 10h.01" />
      <path d="M15 10h.01" />
      <path d="M7 14h10" />
    </svg>
  ),
  Close: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </svg>
  ),
};

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={onChange}
      className="cursor-pointer rounded-full transition-all duration-300 relative"
      style={{
        width: '46px',
        height: '26px',
        backgroundColor: on ? GOLD : 'rgba(255,255,255,0.12)',
        boxShadow: on ? `0 0 12px rgba(212,168,67,0.45), inset 0 1px 2px rgba(0,0,0,0.3)` : 'inset 0 1px 2px rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="absolute top-1/2 rounded-full bg-white transition-all duration-300"
        style={{
          width: '20px',
          height: '20px',
          transform: `translateY(-50%) translateX(${on ? '-3px' : '-23px'})`,
          right: 0,
          boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
        }}
      />
    </button>
  );
}

function Row({ icon, label, children, divider = true }) {
  return (
    <div
      className="flex items-center justify-between py-4"
      style={divider ? { borderBottom: '1px solid rgba(212,168,67,0.08)' } : {}}
    >
      <div className="flex items-center gap-3" style={{ flexDirection: 'row-reverse' }}>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: '38px',
            height: '38px',
            backgroundColor: 'rgba(212,168,67,0.08)',
            border: '1px solid rgba(212,168,67,0.18)',
          }}
        >
          {icon}
        </div>
        <span className="text-white/85 font-ui" style={{ fontSize: '15px' }}>{label}</span>
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

export default function SettingsPanel({ settings, onUpdate, onClose, onAdjustBorders }) {
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center animate-fadeIn"
      style={{
        backgroundColor: 'rgba(5,8,16,0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden mx-4"
        style={{
          maxWidth: '460px',
          background: 'linear-gradient(180deg, rgba(30,36,60,0.96) 0%, rgba(18,22,40,0.98) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(212,168,67,0.22)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212,168,67,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(212,168,67,0.15)' }}
        >
          <h3 className="font-torah text-2xl" style={{ color: GOLD, letterSpacing: '0.02em' }}>הגדרות</h3>
          <button
            onClick={onClose}
            className="rounded-full flex items-center justify-center text-white/40 hover:text-white/90 transition-all duration-200 cursor-pointer"
            style={{ width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.04)' }}
          >
            <Icon.Close size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-2">
          {/* Reading speed */}
          <div className="pt-5 pb-4" style={{ borderBottom: '1px solid rgba(212,168,67,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3" style={{ flexDirection: 'row-reverse' }}>
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: '38px', height: '38px', backgroundColor: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.18)' }}
                >
                  <Icon.Speed size={22} />
                </div>
                <span className="text-white/85 font-ui" style={{ fontSize: '15px' }}>מהירות קריאה</span>
              </div>
              <span className="text-sm font-ui" style={{ color: GOLD }}>
                {settings.speed} <span className="text-white/40">מילים/דקה</span>
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={200}
              value={settings.speed}
              onChange={(e) => onUpdate({ ...settings, speed: Number(e.target.value) })}
              className="w-full h-1 appearance-none rounded-full outline-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:-mt-[6px] [&::-webkit-slider-thumb]:shadow-none
                         [&::-webkit-slider-thumb]:border-0
                         [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                         [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0
                         [&::-moz-range-thumb]:shadow-none"
              style={{
                background: `linear-gradient(to left, ${GOLD} 0%, ${GOLD} ${((settings.speed - 30) / 170) * 100}%, rgba(255,255,255,0.12) ${((settings.speed - 30) / 170) * 100}%, rgba(255,255,255,0.12) 100%)`,
              }}
            />
          </div>

          {/* Adjust borders */}
          <Row icon={<Icon.Borders />} label="התאם שוליים">
            <button
              onClick={() => { onClose(); onAdjustBorders(); }}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-ui transition-all duration-200"
              style={{
                color: GOLD,
                border: `1px solid rgba(212,168,67,0.35)`,
                backgroundColor: 'rgba(212,168,67,0.06)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(212,168,67,0.14)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(212,168,67,0.06)'; }}
            >
              התאם ↔
            </button>
          </Row>

          {/* Hebrew numerals */}
          <Row icon={<Icon.Aleph />} label="אותיות עבריות במספרים">
            <Toggle
              on={settings.hebrewNumerals}
              onChange={() => onUpdate({ ...settings, hebrewNumerals: !settings.hebrewNumerals })}
            />
          </Row>

          {/* Show all text */}
          <Row icon={<Icon.Lines />} label="הצג את כל הטקסט" divider={false}>
            <Toggle
              on={settings.showAllText}
              onChange={() => onUpdate({ ...settings, showAllText: !settings.showAllText })}
            />
          </Row>
        </div>

        {/* Keyboard shortcuts footer */}
        <div
          className="px-6 py-5"
          style={{
            borderTop: '1px solid rgba(212,168,67,0.15)',
            backgroundColor: 'rgba(0,0,0,0.18)',
          }}
        >
          <div className="flex items-center gap-2 mb-4" style={{ flexDirection: 'row-reverse' }}>
            <Icon.Keyboard size={16} />
            <span className="text-white/50 font-ui" style={{ fontSize: '12px' }}>קיצורי מקלדת</span>
          </div>
          <div className="space-y-3 text-white/65 font-ui" style={{ fontSize: '12px' }}>
            {[
              [['רווח', 'נגן / השהה'], ['Esc', 'חזרה']],
              [['←', 'פסוק הבא'], ['→', 'פסוק קודם']],
            ].map((pairs, ri) => (
              <div key={ri} className="flex items-center justify-around">
                {pairs.map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-2">
                    <kbd
                      className="font-mono"
                      style={{
                        fontSize: '11px',
                        minWidth: '32px',
                        textAlign: 'center',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        backgroundColor: 'rgba(212,168,67,0.1)',
                        border: '1px solid rgba(212,168,67,0.25)',
                        color: GOLD,
                      }}
                    >
                      {key}
                    </kbd>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
