import { getSettings } from '../utils/storage';
import { toHebrewNumeral } from '../utils/hebrewNumerals';

export default function ChapterSelector({ book, onSelectChapter, onBack, theme, light }) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  const hn = (n) => getSettings().hebrewNumerals ? toHebrewNumeral(n) : n;
  const subtleColor = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';

  return (
    <div className="min-h-screen flex flex-col items-center pt-16 page-enter"
      style={{ backgroundColor: theme.bg }}>
      <button
        onClick={onBack}
        className="absolute top-6 right-6 cursor-pointer text-sm font-ui transition-opacity hover:opacity-80"
        style={{ color: `${theme.text}4d` }}
      >
        → חזרה
      </button>

      <h2 className="font-torah text-3xl mb-2" style={{ color: `${theme.accent}cc` }}>{book.hebrew}</h2>
      <p className="text-sm mb-10 font-ui" style={{ color: `${theme.text}4d` }}>בחר פרק</p>

      <div className="grid grid-cols-5 md:grid-cols-8 gap-3 w-full max-w-2xl px-6 pb-12">
        {chapters.map((num) => (
          <button
            key={num}
            onClick={() => onSelectChapter(num)}
            className="py-3 border rounded-lg transition-all duration-300 cursor-pointer font-ui text-lg"
            style={{
              backgroundColor: light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
              borderColor: subtleColor,
              color: `${theme.text}b3`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${theme.accent}4d`;
              e.currentTarget.style.color = theme.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = subtleColor;
              e.currentTarget.style.color = `${theme.text}b3`;
            }}
          >
            {hn(num)}
          </button>
        ))}
      </div>
    </div>
  );
}
