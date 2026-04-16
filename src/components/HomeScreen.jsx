import { useState } from 'react';
import torahStructure from '../data/torahStructure.json';
import { getLastPosition, getSettings, saveSettings } from '../utils/storage';
import { toHebrewNumeral, parseHebrewNumeral } from '../utils/hebrewNumerals';

export default function HomeScreen({ onStart, onPerushim }) {
  const { sections, books } = torahStructure;
  const lastPosition = getLastPosition();

  const [selectedBook, setSelectedBook] = useState(lastPosition ? books.find(b => b.english === lastPosition.bookEnglish) || books[0] : books[0]);
  const [selectedChapter, setSelectedChapter] = useState(lastPosition ? lastPosition.chapter : 1);
  const [activeSection, setActiveSection] = useState('Torah');
  const [exiting, setExiting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(getSettings);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  const chapters = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
  const currentSection = sections.find(s => s.english === activeSection);
  const hn = (n) => settings.hebrewNumerals ? toHebrewNumeral(n) : n;

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleStart = () => {
    setExiting(true);
    setTimeout(() => onStart(selectedBook, selectedChapter), 500);
  };

  const handleBookChange = (book) => {
    setSelectedBook(book);
    setSelectedChapter(1);
  };

  // Parse a string as a number — Arabic digits or Hebrew letter-numerals
  const parseNum = (s) => {
    if (!s) return NaN;
    const n = parseInt(s, 10);
    if (!isNaN(n)) return n;
    return parseHebrewNumeral(s);
  };

  // Build all known book name variants sorted by length (longest first)
  // This ensures "שמואל ב" matches before "שמואל", and "I Samuel" before "Samuel"
  const bookNames = (() => {
    const names = [];
    for (const b of books) {
      // Full Hebrew and English names
      names.push({ name: b.hebrew, book: b });
      names.push({ name: b.english.toLowerCase(), book: b });
    }
    // Sort longest first — the key to correct matching
    names.sort((a, b) => b.name.length - a.name.length);
    return names;
  })();

  // Phase 1: Match the book name against the start of the query (longest match first)
  // Phase 2: Parse the remainder as chapter/verse
  const handleSearch = () => {
    setSearchError('');
    let query = searchQuery.trim();
    if (!query) return;

    // Strip geresh (׳) and gershayim (״) — common in Hebrew references like א׳ or י״ב
    query = query.replace(/[׳']/g, '');
    query = query.replace(/[״"]/g, '');

    // Strip filler words (but keep their position so numbers stay in order)
    query = query.replace(/(^|\s)(פרק|פסוק|chapter|verse|ch\.?|v\.?)(\s|$)/gi, ' ');
    query = query.trim();

    // Insert space between letters and digits glued together: "Genesis1:3" → "Genesis 1:3"
    query = query.replace(/([a-zA-Z\u0590-\u05FF])(\d)/g, '$1 $2');
    query = query.replace(/(\d)([a-zA-Z\u0590-\u05FF])/g, '$1 $2');

    // Normalize the query for matching (lowercase for English)
    const queryLower = query.toLowerCase();

    // Phase 1: Find the book — try exact match first (longest first), then prefix match
    let foundBook = null;
    let remainder = '';

    // Try each known book name (longest first) against the start of the query
    for (const { name, book } of bookNames) {
      if (queryLower.startsWith(name)) {
        // Make sure the match is followed by a separator or end of string
        // (so "job" doesn't match inside "joshua")
        const afterMatch = queryLower.slice(name.length);
        if (afterMatch === '' || /^[\s:.,;/]/.test(afterMatch)) {
          foundBook = book;
          remainder = query.slice(name.length).trim();
          break;
        }
      }
    }

    // If no exact match, try prefix matching (e.g. "gen" → Genesis, "ברא" → בראשית)
    if (!foundBook) {
      // Extract the text portion before the first number (allow ' for abbreviations like בר')
      const textMatch = query.match(/^([a-zA-Z\u0590-\u05FF\s]+)/);
      if (textMatch) {
        const prefix = textMatch[1].trim();
        const prefixLower = prefix.toLowerCase();
        const matches = books.filter(
          b => b.hebrew.startsWith(prefix) || b.english.toLowerCase().startsWith(prefixLower)
        );
        if (matches.length === 1) {
          foundBook = matches[0];
          remainder = query.slice(textMatch[1].length).trim();
        } else if (matches.length > 1) {
          // Pick shortest name (most specific), or show ambiguous error
          const sorted = [...matches].sort((a, b) => a.hebrew.length - b.hebrew.length);
          if (sorted[0].hebrew.length < sorted[1].hebrew.length) {
            foundBook = sorted[0];
            remainder = query.slice(textMatch[1].length).trim();
          } else {
            const options = matches.map(b => b.hebrew).join(', ');
            setSearchError(`"${prefix}" מתאים לכמה ספרים: ${options}`);
            return;
          }
        }
      }
    }

    if (!foundBook) {
      setSearchError('לא נמצא ספר (לדוגמה: בראשית טו)');
      return;
    }

    // Phase 2: Parse the remainder as chapter and optional verse (with optional dash range)
    if (!remainder) {
      setSearchError('הכנס מספר פרק (לדוגמה: בראשית טו)');
      return;
    }

    // Split remainder on separators (space, colon, comma, period, semicolon, slash)
    // But preserve dash within a token for verse ranges like "יב-יט" or "12-19"
    const numParts = remainder.split(/[\s:.,;/]+/).filter(Boolean);
    if (numParts.length === 0) {
      setSearchError('הכנס מספר פרק (לדוגמה: בראשית טו)');
      return;
    }

    const chapterNum = parseNum(numParts[0]);

    // Parse verse — may contain a dash range like "12-19" or "יב-יט"
    let verseNum = null;
    if (numParts.length >= 2) {
      const versePart = numParts[1];
      const dashIdx = versePart.indexOf('-');
      if (dashIdx > 0) {
        // Verse range: take the start verse
        verseNum = parseNum(versePart.slice(0, dashIdx));
      } else {
        verseNum = parseNum(versePart);
      }
    }

    if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > foundBook.chapters) {
      setSearchError(`פרק ${numParts[0]} לא קיים ב${foundBook.hebrew} (1-${foundBook.chapters})`);
      return;
    }

    setExiting(true);
    setTimeout(() => onStart(foundBook, chapterNum, verseNum), 500);
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-6 ${exiting ? 'splash-exit' : 'splash-enter'}`}
      style={{
        backgroundImage: 'url(/home-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#050508',
      }}
    >
      {/* Settings gear button — top right */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed top-6 left-6 z-50 cursor-pointer transition-all duration-300 hover:brightness-125 flex items-center justify-center"
        style={{ width: '40px', height: '40px' }}
      >
        <img
          src="/icon-settings.png"
          alt="הגדרות"
          style={{ width: '40px', height: '40px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(4)', transformOrigin: 'center' }}
        />
      </button>

      {/* Home settings panel */}
      {showSettings && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="absolute top-16 left-6 rounded-2xl p-6 w-72 shadow-2xl"
            style={{ backgroundColor: '#252d50', border: '1px solid rgba(212,168,67,0.3)' }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <h3 className="font-torah text-xl text-gold/80 mb-6">הגדרות</h3>

            {/* Hebrew numerals toggle */}
            <div className="flex items-center justify-between">
              <label className="text-white/50 text-sm font-ui">אותיות עבריות</label>
              <button
                onClick={() => updateSettings({ ...settings, hebrewNumerals: !settings.hebrewNumerals })}
                className="cursor-pointer w-12 h-6 rounded-full transition-all duration-300 flex items-center px-1"
                style={{ backgroundColor: settings.hebrewNumerals ? 'rgba(212,168,67,0.6)' : 'rgba(255,255,255,0.15)' }}
              >
                <div
                  className="w-4 h-4 rounded-full bg-white transition-all duration-300"
                  style={{ transform: settings.hebrewNumerals ? 'translateX(0px)' : 'translateX(24px)' }}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-3xl text-center">
        {/* Title */}
        <h1
          className="text-gold mb-2 tracking-wide"
          style={{ fontFamily: 'var(--font-title)', fontSize: 'clamp(3rem, 8vw, 4.5rem)' }}
        >
          קורא תנ״ך
        </h1>
        <p className="text-white/35 text-lg font-ui mb-6">חווית קריאה אינטראקטיבית</p>

        {/* Search bar */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              dir="rtl"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="חיפוש — בראשית טו ג / שמות ב יב-יט"
              className="w-full px-5 py-3 rounded-xl border border-white/15 bg-black/40 backdrop-blur-sm text-white/80 text-lg font-ui placeholder-white/25 outline-none transition-all duration-300 focus:border-gold/50 focus:shadow-[0_0_20px_rgba(212,168,67,0.1)] text-center"
              style={{ fontFamily: 'var(--font-title)' }}
            />
          </div>
          {searchError && (
            <p className="text-red-400/80 text-sm font-ui mt-2" dir="rtl">{searchError}</p>
          )}
        </div>

        {/* Section tabs: תורה | נביאים ראשונים | נביאים אחרונים | כתובים */}
        <div className="mb-5" dir="rtl">
          <div className="flex gap-2 justify-center flex-wrap mb-5">
            {sections.map((section) => (
              <button
                key={section.english}
                onClick={() => setActiveSection(section.english)}
                className={`px-5 py-2 rounded-lg border text-base font-ui cursor-pointer transition-all duration-300 ${
                  activeSection === section.english
                    ? 'border-gold/50 bg-gold/10 text-gold'
                    : 'border-white/8 text-white/30 hover:border-white/20 hover:text-white/50'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>

          {/* Book selector for active section */}
          <div className="flex gap-2 justify-center flex-wrap">
            {currentSection && currentSection.books.map((book) => (
              <button
                key={book.english}
                onClick={() => handleBookChange(book)}
                className={`px-4 py-2.5 rounded-xl border text-lg cursor-pointer transition-all duration-300 ${
                  selectedBook.english === book.english
                    ? 'border-gold/50 bg-gold/10 text-gold shadow-[0_0_20px_rgba(212,168,67,0.1)]'
                    : 'border-white/8 text-white/40 hover:border-white/20 hover:text-white/60'
                }`}
                style={{ fontFamily: 'var(--font-title)' }}
              >
                {book.hebrew}
              </button>
            ))}
          </div>
        </div>

        {/* Chapter grid */}
        <div className="mb-8" dir="rtl">
          <label className="block text-white/45 text-base font-ui mb-4">בחר פרק</label>
          <div className="max-h-[200px] overflow-y-auto rounded-2xl border border-white/8 bg-black/30 p-4 backdrop-blur-sm">
            <div className="grid grid-cols-8 md:grid-cols-10 gap-2">
              {chapters.map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedChapter(num)}
                  className={`py-2.5 rounded-lg text-base font-ui cursor-pointer transition-all duration-200 ${
                    selectedChapter === num
                      ? 'bg-gold/20 text-gold border border-gold/40 shadow-[0_0_12px_rgba(212,168,67,0.15)]'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {hn(num)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="px-16 py-5 border border-gold/30 rounded-xl text-gold text-2xl
                     cursor-pointer transition-all duration-500 hover:border-gold/60
                     hover:shadow-[0_0_50px_rgba(212,168,67,0.2)] hover:bg-gold/5"
          style={{ fontFamily: 'var(--font-title)' }}
        >
          התחל לקרוא
        </button>

        {/* Perushim button */}
        <button
          onClick={onPerushim}
          className="mt-6 px-10 py-3 border border-white/15 rounded-xl text-white/40 text-lg
                     cursor-pointer transition-all duration-500 hover:border-gold/40
                     hover:text-gold hover:shadow-[0_0_30px_rgba(212,168,67,0.1)] hover:bg-gold/5"
          style={{ fontFamily: 'var(--font-title)' }}
        >
          פירושים
        </button>

        {/* Current selection label */}
        <p className="mt-6 text-white/25 text-base font-ui">
          {selectedBook.hebrew} | פרק {hn(selectedChapter)}
        </p>
      </div>
    </div>
  );
}
