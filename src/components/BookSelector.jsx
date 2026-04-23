import torahStructure from '../data/torahStructure.json';
import { getSettings } from '../utils/storage';
import { toHebrewNumeral } from '../utils/hebrewNumerals';

export default function BookSelector({ onSelectBook, onBack, theme, light }) {
  const { books } = torahStructure;
  const hn = (n) => getSettings().hebrewNumerals ? toHebrewNumeral(n) : n;
  const subtleColor = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
  const hoverBorder = `${theme.accent}33`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center page-enter"
      style={{ backgroundColor: theme.bg }}>
      <button
        onClick={onBack}
        className="absolute top-6 right-6 cursor-pointer text-sm font-ui transition-opacity hover:opacity-80"
        style={{ color: `${theme.text}4d` }}
      >
        → חזרה
      </button>

      <h2 className="font-torah text-3xl mb-12" style={{ color: `${theme.accent}cc` }}>בחר ספר</h2>

      <div className="grid gap-4 w-full max-w-md px-6">
        {books.map((book) => (
          <button
            key={book.english}
            onClick={() => onSelectBook(book)}
            className="group relative py-5 px-8 border rounded-xl transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 cursor-pointer text-right"
            style={{ backgroundColor: light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', borderColor: subtleColor }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = hoverBorder; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = subtleColor; }}
          >
            <div className="flex justify-between items-center" dir="rtl">
              <span className="font-torah text-2xl transition-colors duration-300"
                style={{ color: `${theme.text}e6` }}>
                {book.hebrew}
              </span>
              <span className="text-sm font-ui" style={{ color: `${theme.text}33` }}>
                {hn(book.chapters)} פרקים
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
