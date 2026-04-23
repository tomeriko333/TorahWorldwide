import { useState, useEffect } from 'react';
import torahStructure from '../data/torahStructure.json';
import { getLastPosition, getSettings, saveSettings } from '../utils/storage';
import { toHebrewNumeral } from '../utils/hebrewNumerals';
import { parseSearchRef } from '../utils/searchRef';

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
  const [searchFocused, setSearchFocused] = useState(false);
  const [cyclingPlaceholder, setCyclingPlaceholder] = useState('');
  const [cycleTick, setCycleTick] = useState(0);
  const [arrowHover, setArrowHover] = useState(false);
  const [arrowPulsing, setArrowPulsing] = useState(false);
  const [diceHover, setDiceHover] = useState(false);
  const [diceSpinning, setDiceSpinning] = useState(false);
  // Wallpaper cycling — add more filenames under /public as they're created
  const WALLPAPERS = ['/home-bg-original.webp'];
  const [wallpaperIdx, setWallpaperIdx] = useState(0);
  const nextWallpaper = () => setWallpaperIdx((i) => (i + 1) % WALLPAPERS.length);
  const prevWallpaper = () => setWallpaperIdx((i) => (i - 1 + WALLPAPERS.length) % WALLPAPERS.length);
  // Scroll collapse — slides scroll off-screen to reveal the full wallpaper
  const [scrollCollapsed, setScrollCollapsed] = useState(false);
  // UI-hidden mode — click the eye to show ONLY the wallpaper (everything else hidden except the eye itself)
  const [uiHidden, setUiHidden] = useState(false);

  const [searchPlaceholders] = useState(() => {
    const torahBooks = sections.find((s) => s.english === 'Torah').books;
    const pickRandom = (bookList) => {
      const book = bookList[Math.floor(Math.random() * bookList.length)];
      const chapter = Math.floor(Math.random() * book.chapters) + 1;
      return `${book.hebrew} ${toHebrewNumeral(chapter)}`;
    };
    return [
      pickRandom(torahBooks),
      pickRandom(torahBooks),
      pickRandom(books),
      pickRandom(books),
      pickRandom(books),
    ];
  });

  const quickSuggestions = searchPlaceholders.map((q) => ({ label: q, query: q }));

  useEffect(() => {
    const pickRandomRef = () => {
      const book = books[Math.floor(Math.random() * books.length)];
      const chapter = Math.floor(Math.random() * book.chapters) + 1;
      return `${book.hebrew} ${toHebrewNumeral(chapter)}`;
    };
    setCyclingPlaceholder(pickRandomRef());
    const interval = setInterval(() => {
      setCyclingPlaceholder(pickRandomRef());
      setCycleTick((t) => t + 1);
    }, 7000);
    return () => clearInterval(interval);
  }, [books]);

  const chapters = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
  const currentSection = sections.find(s => s.english === activeSection);
  const hn = (n) => settings.hebrewNumerals ? toHebrewNumeral(n) : n;

  // ───────────────────── Breathing-width logic ─────────────────────
  // Content panel widens as book count / chapter count grows.
  // Book row: stays on one line until 8 books, then splits into balanced rows
  // (top row has ceil(N/2), bottom has floor(N/2)). Chapter grid width follows
  // the book-row width at ~85% so it's visually subordinate.
  const bookCount = currentSection?.books?.length ?? 5;
  const chapterCount = selectedBook.chapters;
  const booksPerRow = bookCount <= 8 ? bookCount : Math.ceil(bookCount / 2);
  // Split books into rows (top-heavy if odd): [8,7] for 15, [7,6] for 13, etc.
  const bookRows = [];
  if (currentSection) {
    for (let i = 0; i < currentSection.books.length; i += booksPerRow) {
      bookRows.push(currentSection.books.slice(i, i + booksPerRow));
    }
  }
  // Each book button ≈ 138px for longer Hebrew names (יחזקאל, ישעיהו). +60 padding.
  const desiredBookRowWidth = Math.max(720, 138 * booksPerRow + 60);
  const contentMaxWidth = `min(${desiredBookRowWidth}px, 90vw)`;
  // Chapter grid breathes too — follows book-row width × 0.85, tightened by chapter count.
  const chapterGridMaxPx = (() => {
    const base = Math.round(desiredBookRowWidth * 0.85);
    if (chapterCount <= 20) return Math.min(base, 560);
    if (chapterCount <= 60) return Math.min(base, 900);
    return Math.min(base, 1100);
  })();
  const chapterGridMaxWidth = `min(${chapterGridMaxPx}px, 85vw)`;
  // More columns on longer books keeps the grid from becoming too tall.
  const chapterCols =
    chapterCount <= 12 ? 6
    : chapterCount <= 30 ? 10
    : chapterCount <= 80 ? 12
    : 15;

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleStart = () => {
    setExiting(true);
    setTimeout(() => onStart(selectedBook, selectedChapter), 220);
  };

  const handleBookChange = (book) => {
    setSelectedBook(book);
    setSelectedChapter(1);
  };

  const handleSearch = (overrideQuery) => {
    const query = typeof overrideQuery === 'string' ? overrideQuery : searchQuery;
    const result = parseSearchRef(query, books);
    if (result.error !== undefined) {
      setSearchError(result.error);
      return;
    }
    setSearchError('');
    setExiting(true);
    setTimeout(() => onStart(result.book, result.chapter, result.verse), 220);
  };

  // Roll a random book + chapter and jump to it
  const handleRandom = () => {
    setDiceSpinning(true);
    setTimeout(() => setDiceSpinning(false), 600);
    const book = books[Math.floor(Math.random() * books.length)];
    const chapterNum = Math.floor(Math.random() * book.chapters) + 1;
    setSearchError('');
    setExiting(true);
    setTimeout(() => onStart(book, chapterNum, null), 220);
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-6 ${exiting ? 'splash-exit' : 'splash-enter'}`}
      style={{
        backgroundImage: `url(${WALLPAPERS[wallpaperIdx]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#050508',
        transition: 'background-image 0.6s ease',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Settings gear — top-left, hidden when uiHidden */}
      {!uiHidden && (
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed top-6 left-6 z-50 cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center"
        style={{ width: '40px', height: '40px' }}
        aria-label="הגדרות"
      >
        <img
          src="/icon-settings.png"
          alt=""
          style={{ width: '40px', height: '40px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(7.2) translateX(1px)', transformOrigin: 'center', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))' }}
        />
      </button>
      )}

      {/* Bottom-right control cluster: wallpaper arrows (hidden when UI hidden) + eye toggle (always visible) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5">
        {!uiHidden && (
          <>
            <button
              onClick={prevWallpaper}
              aria-label="טפט קודם"
              className="flex items-center justify-center cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125"
              style={{
                width: '34px',
                height: '34px',
                color: '#f4d78a',
                background: 'linear-gradient(180deg, rgba(20,28,50,0.88), rgba(10,14,26,0.92))',
                border: '1px solid rgba(244,215,138,0.45)',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={nextWallpaper}
              aria-label="טפט הבא"
              className="flex items-center justify-center cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125"
              style={{
                width: '34px',
                height: '34px',
                color: '#f4d78a',
                background: 'linear-gradient(180deg, rgba(20,28,50,0.88), rgba(10,14,26,0.92))',
                border: '1px solid rgba(244,215,138,0.45)',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
        {/* Eye toggle — always visible so user can restore UI */}
        <button
          onClick={() => setUiHidden((v) => !v)}
          aria-label={uiHidden ? 'הצג תפריט' : 'הסתר תפריט'}
          title={uiHidden ? 'הצג תפריט' : 'הסתר תפריט'}
          className="flex items-center justify-center cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125"
          style={{
            width: '34px',
            height: '34px',
            color: '#f4d78a',
            background: 'linear-gradient(180deg, rgba(20,28,50,0.88), rgba(10,14,26,0.92))',
            border: '1px solid rgba(244,215,138,0.45)',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {uiHidden ? (
            // Eye-off — UI currently hidden; click to show
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.8 19.8 0 0 1 5.06-6.06" />
              <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.8 19.8 0 0 1-3.17 4.19" />
              <path d="M1 1l22 22" />
              <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
            </svg>
          ) : (
            // Eye open — UI currently shown; click to hide
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

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
                className="cursor-pointer w-12 h-6 rounded-full transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 flex items-center px-1"
                style={{ backgroundColor: settings.hebrewNumerals ? 'rgba(212,168,67,0.6)' : 'rgba(255,255,255,0.15)' }}
              >
                <div
                  className="w-4 h-4 rounded-full bg-white transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200"
                  style={{ transform: settings.hebrewNumerals ? 'translateX(0px)' : 'translateX(24px)' }}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title + artistic subtitle — pinned near top, centered (hidden in eye-off mode) */}
      {!uiHidden && (
      <div
        className="fixed z-20 text-center"
        style={{
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <h1
          className="m-0 p-0 whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: 'clamp(5.9rem, 15.7vw, 8.8rem)',
            letterSpacing: '0.16em',
            fontWeight: 500,
            lineHeight: 1,
            background: 'linear-gradient(180deg, #f8dfa0 0%, #e6bd5a 55%, #b8902f 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            filter: 'drop-shadow(0 3px 12px rgba(0,0,0,0.85))',
          }}
        >
          אוצר התורה
        </h1>

        {/* Artistic subtitle — stretched with long flanking gold lines */}
        <div className="flex items-center justify-center gap-5 mt-6">
          <div
            style={{
              height: '1px',
              width: 'clamp(80px, 18vw, 220px)',
              background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.75))',
              boxShadow: '0 0 6px rgba(212,168,67,0.3)',
            }}
          />
          <p
            className="whitespace-nowrap m-0 p-0"
            dir="rtl"
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)',
              letterSpacing: '0.32em',
              fontWeight: 300,
              color: '#f4d78a',
              textShadow: '0 2px 6px rgba(0,0,0,0.85), 0 0 18px rgba(212,168,67,0.45)',
            }}
          >
            כל התנ״ך, חי ונושם, לפניך
          </p>
          <div
            style={{
              height: '1px',
              width: 'clamp(80px, 18vw, 220px)',
              background: 'linear-gradient(90deg, rgba(212,168,67,0.75), transparent)',
              boxShadow: '0 0 6px rgba(212,168,67,0.3)',
            }}
          />
        </div>
      </div>
      )}

      {!uiHidden && (
      <div
        className="relative z-10 w-full text-center"
        style={{
          maxWidth: contentMaxWidth,
          paddingBottom: '2rem',
          marginTop: '180px',
          zoom: 0.9,
          transition: 'max-width 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className="relative">
        {/* Section tabs — glass nav */}
        <div className="mb-8 flex justify-center gap-11" dir="rtl">
          {sections.map((section) => {
            const isActive = activeSection === section.english;
            return (
              <button
                key={section.english}
                onClick={() => setActiveSection(section.english)}
                className="relative cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 pb-2"
                style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '1.15rem',
                  letterSpacing: '0.22em',
                  color: isActive ? '#f4d78a' : 'rgba(255,255,255,0.88)',
                  textShadow: isActive
                    ? '0 2px 8px rgba(0,0,0,0.95), 0 0 20px rgba(212,168,67,0.75)'
                    : '0 2px 8px rgba(0,0,0,0.95)',
                }}
              >
                {section.name}
                <span
                  aria-hidden
                  className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 transition-all duration-400"
                  style={{
                    height: '1.5px',
                    width: isActive ? '100%' : '0%',
                    background: 'linear-gradient(90deg, transparent, #f4d78a 50%, transparent)',
                    boxShadow: isActive ? '0 0 8px rgba(244,215,138,0.6)' : 'none',
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Book boxes — split into balanced rows (top has one more when odd) */}
        <div className="mb-10 flex flex-col gap-2.5" dir="rtl">
          {bookRows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-2.5 justify-center">
              {row.map((book) => {
                const isActive = selectedBook.english === book.english;
                return (
                  <button
                    key={book.english}
                    onClick={() => handleBookChange(book)}
                    className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200"
                    style={{
                      minWidth: '110px',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      fontSize: '1.2rem',
                      fontFamily: 'var(--font-title)',
                      letterSpacing: '0.02em',
                      color: isActive ? '#f4d78a' : 'rgba(255,255,255,0.92)',
                      background: isActive
                        ? 'linear-gradient(180deg, rgba(212,168,67,0.42), rgba(140,100,35,0.72))'
                        : 'linear-gradient(180deg, rgba(20,28,50,0.82), rgba(10,14,26,0.9))',
                      border: isActive
                        ? '1.5px solid rgba(244,215,138,0.85)'
                        : '1px solid rgba(255,255,255,0.25)',
                      textShadow: isActive
                        ? '0 2px 8px rgba(0,0,0,0.95), 0 0 14px rgba(244,215,138,0.65)'
                        : '0 2px 8px rgba(0,0,0,0.95)',
                      boxShadow: isActive
                        ? '0 0 30px rgba(212,168,67,0.4), inset 0 0 12px rgba(212,168,67,0.1)'
                        : '0 3px 14px rgba(0,0,0,0.55)',
                    }}
                  >
                    {book.hebrew}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* "בחר פרק" ornamental header */}
        <div className="flex items-center justify-center gap-6 mt-3 mb-7" dir="rtl">
          <div style={{
            height: '1px',
            flex: 1,
            maxWidth: '150px',
            background: 'linear-gradient(90deg, transparent, rgba(244,215,138,0.8))',
            boxShadow: '0 0 6px rgba(212,168,67,0.4)',
          }} />
          <span
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: '1rem',
              color: '#f4d78a',
              letterSpacing: '0.4em',
              textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 14px rgba(244,215,138,0.6)',
            }}
          >
            בחר פרק
          </span>
          <div style={{
            height: '1px',
            flex: 1,
            maxWidth: '150px',
            background: 'linear-gradient(90deg, rgba(244,215,138,0.8), transparent)',
            boxShadow: '0 0 6px rgba(212,168,67,0.4)',
          }} />
        </div>

        {/* Chapter grid — breathes with chapter count (wider for Psalms-scale books) */}
        <div className="mb-11 flex justify-center">
          <div
            dir="rtl"
            className="max-h-[260px] overflow-y-auto py-5 px-4"
            style={{
              width: '100%',
              maxWidth: chapterGridMaxWidth,
              transition: 'max-width 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div
              className="grid gap-2 justify-items-center"
              style={{ gridTemplateColumns: `repeat(${chapterCols}, minmax(0, 1fr))` }}
            >
              {chapters.map((num) => {
                const isActive = selectedChapter === num;
                return (
                  <button
                    key={num}
                    onClick={() => setSelectedChapter(num)}
                    className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 flex items-center justify-center"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-ui)',
                      color: isActive ? '#f4d78a' : 'rgba(255,255,255,0.92)',
                      background: isActive
                        ? 'radial-gradient(circle, rgba(244,215,138,0.32), rgba(212,168,67,0.06))'
                        : 'rgba(255,255,255,0.05)',
                      border: isActive
                        ? '1.5px solid rgba(244,215,138,0.9)'
                        : '1px solid rgba(255,255,255,0.16)',
                      textShadow: isActive
                        ? '0 1px 4px rgba(0,0,0,0.95), 0 0 12px rgba(244,215,138,0.75)'
                        : '0 1px 4px rgba(0,0,0,0.9)',
                      animation: isActive ? 'chapter-pulse 2.4s ease-in-out infinite' : 'none',
                    }}
                  >
                    {hn(num)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Primary CTA — glass gold */}
        <button
          onClick={handleStart}
          className="inline-flex items-center justify-center rounded-xl cursor-pointer transition-all duration-500 hover:brightness-110"
          style={{
            marginTop: '18px',
            padding: '16px 56px',
            background: 'linear-gradient(180deg, rgba(212,168,67,0.5), rgba(140,100,35,0.72))',
            border: '1.5px solid rgba(244,215,138,0.88)',
            fontSize: '1.38rem',
            color: '#f8dfa0',
            letterSpacing: '0.08em',
            fontFamily: 'var(--font-title)',
            boxShadow:
              '0 10px 44px rgba(212,168,67,0.38), inset 0 0 26px rgba(244,215,138,0.14), 0 3px 20px rgba(0,0,0,0.6)',
            textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 16px rgba(244,215,138,0.55)',
          }}
        >
          התחל לקרוא&nbsp;&nbsp;·&nbsp;&nbsp;{selectedBook.hebrew} {hn(selectedChapter)}
        </button>

        {/* Secondary — Perushim */}
        <div className="mt-7">
          <button
            onClick={onPerushim}
            className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200"
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: '1.06rem',
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.82)',
              textShadow: '0 2px 8px rgba(0,0,0,0.95)',
            }}
          >
            פירושים
          </button>
        </div>
        </div>
      </div>
      )}

      {/* Search bar — pinned to bottom of screen (hidden in eye-off mode) */}
      {!uiHidden && (
      <div
        className="fixed z-30"
        style={{
          bottom: '28px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(92vw, 600px)',
        }}
      >
        {/* Quick suggestions — pop UP above the bar when focused + empty */}
        {searchFocused && !searchQuery && (
          <div
            className="absolute left-0 right-0 flex flex-wrap gap-2 justify-center fade-in"
            style={{ bottom: 'calc(100% + 14px)' }}
            dir="rtl"
          >
            {quickSuggestions.map((s) => (
              <button
                key={s.query}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchQuery(s.query);
                  handleSearch(s.query);
                }}
                className="px-4 py-2 rounded-full border border-gold/30 text-gold/80 text-sm font-ui cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:border-gold/70 hover:text-gold hover:bg-gold/10"
                style={{
                  background: 'linear-gradient(180deg, rgba(20,28,50,0.88), rgba(10,14,26,0.92))',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Search bar wrapper — dice on physical left, bar in middle, arrow on physical right */}
        <div className="flex items-center gap-3">
          {/* Dice button — roll a random chapter */}
          <button
            onClick={handleRandom}
            onMouseEnter={() => setDiceHover(true)}
            onMouseLeave={() => setDiceHover(false)}
            aria-label="פרק אקראי"
            title="פרק אקראי"
            className="flex items-center justify-center text-gold cursor-pointer"
            style={{
              width: '44px',
              height: '44px',
              background: 'transparent',
              border: 'none',
              flexShrink: 0,
              filter: diceHover
                ? 'drop-shadow(0 0 14px rgba(212,168,67,0.75))'
                : 'drop-shadow(0 0 6px rgba(212,168,67,0.3))',
              transform: diceSpinning ? 'rotate(360deg) scale(1.12)' : 'rotate(0deg) scale(1)',
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8" cy="8" r="1.1" fill="currentColor" />
              <circle cx="16" cy="8" r="1.1" fill="currentColor" />
              <circle cx="12" cy="12" r="1.1" fill="currentColor" />
              <circle cx="8" cy="16" r="1.1" fill="currentColor" />
              <circle cx="16" cy="16" r="1.1" fill="currentColor" />
            </svg>
          </button>

          {/* Bar + animated border */}
          <div className="relative flex-1">
            {/* Main bar: glassmorphism */}
            <div
              className="relative rounded-2xl overflow-hidden transition-[box-shadow] duration-300"
              style={{
                background: 'linear-gradient(180deg, rgba(15,22,40,0.82), rgba(8,12,22,0.88))',
                border: '2px solid rgba(255,255,255,0.12)',
                boxShadow: searchFocused
                  ? '0 12px 40px rgba(0,0,0,0.55), 0 0 45px rgba(212,168,67,0.18), inset 0 0 30px rgba(212,168,67,0.07)'
                  : '0 10px 30px rgba(0,0,0,0.45), inset 0 0 12px rgba(212,168,67,0.03)',
              }}
              dir="rtl"
            >
              <input
                type="text"
                dir="rtl"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchError(''); }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder=""
                className="w-full px-6 py-4 bg-transparent text-white/90 text-xl outline-none text-center"
                style={{
                  fontFamily: 'var(--font-title)',
                  caretColor: '#d4a843',
                }}
              />

              {/* Rotating placeholder — centered across the bar */}
              {!searchQuery && (
                <div
                  key={cycleTick}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none fade-in text-xl"
                  style={{
                    fontFamily: 'var(--font-title)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <span style={{ color: 'rgba(212,168,67,0.55)', marginLeft: '8px' }}>חיפוש —</span>
                  {cyclingPlaceholder}
                </div>
              )}
            </div>

            {/* Animated gold border draw-in on focus */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none transition-transform duration-500 ease-out"
              style={{
                border: '2px solid rgba(212,168,67,0.75)',
                transformOrigin: 'center',
                transform: searchFocused ? 'scaleX(1)' : 'scaleX(0)',
                boxShadow: searchFocused ? '0 0 35px rgba(212,168,67,0.25)' : 'none',
              }}
            />
          </div>

          {/* Standalone gold arrow — no circle, glows on hover, pulses on click */}
          <button
            onClick={() => {
              setArrowPulsing(true);
              setTimeout(() => setArrowPulsing(false), 280);
              handleSearch();
            }}
            onMouseEnter={() => setArrowHover(true)}
            onMouseLeave={() => setArrowHover(false)}
            aria-label="חפש"
            className="flex items-center justify-center text-gold cursor-pointer"
            style={{
              width: '44px',
              height: '44px',
              background: 'transparent',
              border: 'none',
              flexShrink: 0,
              filter: arrowHover
                ? 'drop-shadow(0 0 14px rgba(212,168,67,0.75))'
                : 'drop-shadow(0 0 6px rgba(212,168,67,0.3))',
              transform: arrowPulsing ? 'scale(1.18)' : 'scale(1)',
              transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>

        {searchError && (
          <p className="text-red-400/90 text-sm font-ui mt-3 text-center" dir="rtl">{searchError}</p>
        )}
      </div>
      )}
    </div>
  );
}
