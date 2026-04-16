import { createPortal } from 'react-dom';

export default function SettingsPanel({ settings, onUpdate, onClose, onAdjustBorders }) {
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-8 w-full max-w-md mx-6 shadow-2xl"
        style={{ backgroundColor: '#252d50', border: '1px solid rgba(212,168,67,0.3)' }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-torah text-2xl text-gold/80">הגדרות</h3>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white cursor-pointer text-xl"
          >
            ✕
          </button>
        </div>

        {/* Reading speed */}
        <div className="mb-6">
          <label className="block text-white/50 text-sm font-ui mb-2">
            מהירות קריאה — {settings.speed} מילים/דקה
          </label>
          <input
            type="range"
            min={30}
            max={200}
            value={settings.speed}
            onChange={(e) => onUpdate({ ...settings, speed: Number(e.target.value) })}
            className="w-full h-1 appearance-none bg-white/10 rounded-full outline-none
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Adjust borders button */}
        <div className="mb-6">
          <button
            onClick={() => {
              onClose();
              onAdjustBorders();
            }}
            className="w-full py-3 rounded-xl border border-gold/30 text-gold/70 hover:text-gold
                       hover:border-gold/50 hover:bg-gold/5 transition-all duration-300 cursor-pointer font-ui text-sm"
          >
            התאם שוליים ↔
          </button>
          <p className="text-white/25 text-xs font-ui mt-1.5 text-center">
            גרור את הידיות בצדי המסך כדי לשנות את רוחב הטקסט
          </p>
        </div>

        {/* Hebrew numerals toggle */}
        <div className="mb-6 flex items-center justify-between">
          <label className="text-white/50 text-sm font-ui">אותיות עבריות במספרים</label>
          <button
            onClick={() => onUpdate({ ...settings, hebrewNumerals: !settings.hebrewNumerals })}
            className="cursor-pointer w-12 h-6 rounded-full transition-all duration-300 flex items-center px-1"
            style={{ backgroundColor: settings.hebrewNumerals ? 'rgba(212,168,67,0.6)' : 'rgba(255,255,255,0.15)' }}
          >
            <div
              className="w-4 h-4 rounded-full bg-white transition-all duration-300"
              style={{ transform: settings.hebrewNumerals ? 'translateX(0px)' : 'translateX(24px)' }}
            />
          </button>
        </div>

        {/* Show all text toggle */}
        <div className="mb-6 flex items-center justify-between">
          <label className="text-white/50 text-sm font-ui">הצג את כל הטקסט</label>
          <button
            onClick={() => onUpdate({ ...settings, showAllText: !settings.showAllText })}
            className="cursor-pointer w-12 h-6 rounded-full transition-all duration-300 flex items-center px-1"
            style={{ backgroundColor: settings.showAllText ? 'rgba(212,168,67,0.6)' : 'rgba(255,255,255,0.15)' }}
          >
            <div
              className="w-4 h-4 rounded-full bg-white transition-all duration-300"
              style={{ transform: settings.showAllText ? 'translateX(0px)' : 'translateX(24px)' }}
            />
          </button>
        </div>

        {/* Keyboard shortcuts info */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-white/30 text-xs font-ui mb-2">קיצורי מקלדת:</p>
          <div className="grid grid-cols-2 gap-1 text-white/40 text-xs font-ui">
            <span>רווח — נגן/השהה</span>
            <span>Esc — חזרה</span>
            <span>← — פסוק הבא</span>
            <span>→ — פסוק קודם</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
