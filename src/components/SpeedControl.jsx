export default function SpeedControl({ playing, onTogglePlay, speed, onSpeedChange, onPrev, onNext, hasPrev, hasNext }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5" style={{ backgroundColor: '#0a0e1a' }}>
      <div className="py-4 flex items-center gap-4" style={{ paddingLeft: '50px', paddingRight: '50px' }} dir="rtl">
        {/* Prev chapter */}
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={`w-10 h-10 rounded-full border flex items-center justify-center text-lg cursor-pointer transition-all duration-300 ${
            hasPrev
              ? 'border-white/20 text-white/50 hover:text-gold hover:border-gold/40'
              : 'border-white/10 text-white/15 cursor-default'
          }`}
          title="פרק קודם"
        >
          →
        </button>

        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center
                     text-gold transition-all duration-300 cursor-pointer text-lg"
          title={playing ? 'השהה (Space)' : 'נגן (Space)'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        {/* Next chapter */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`w-10 h-10 rounded-full border flex items-center justify-center text-lg cursor-pointer transition-all duration-300 ${
            hasNext
              ? 'border-white/20 text-white/50 hover:text-gold hover:border-gold/40'
              : 'border-white/10 text-white/15 cursor-default'
          }`}
          title="פרק הבא"
        >
          ←
        </button>

        {/* Speed slider */}
        <div className="flex-1 flex items-center gap-3">
          <input
            type="range"
            min={30}
            max={200}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="flex-1 h-1 appearance-none bg-white/10 rounded-full outline-none
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Speed display */}
        <span className="text-gold/60 text-sm font-ui min-w-[50px] text-center">
          {speed} מ/ד
        </span>
      </div>
    </div>
  );
}
