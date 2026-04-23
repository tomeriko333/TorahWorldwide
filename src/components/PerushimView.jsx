import { useState } from 'react';
import torahStructure from '../data/torahStructure.json';
import { getSettings } from '../utils/storage';
import { toHebrewNumeral } from '../utils/hebrewNumerals';

// Perushim data — add entries here as { book, chapter, verse, title, content }
const perushimData = [
  {
    book: 'Deuteronomy',
    chapter: 18,
    verse: '16-22',
    title: 'איך נולד מוסד הנבואה',
    content: `רוב האנשים יודעים שמשה היה נביא. רוב האנשים יודעים שהיו נביאים בתנ״ך. אבל רוב האנשים לא יודעים למה בכלל יש נביאים. מאיפה זה הגיע? למה אלוהים לא פשוט מדבר לכולם ישירות?\n\nהתשובה נמצאת בדברים יח. והיא מפתיעה — כי זה לא אלוהים שהחליט. זה העם שביקש.`
  }
];

export default function PerushimView({ onBack }) {
  const { books } = torahStructure;
  const [activeBook, setActiveBook] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [activePerush, setActivePerush] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const hn = (n) => getSettings().hebrewNumerals ? toHebrewNumeral(n) : n;

  // Get perushim for a specific book and chapter
  const getPerushim = (bookEnglish, chapter) => {
    return perushimData.filter(p => p.book === bookEnglish && p.chapter === chapter);
  };

  // Get chapters that have perushim for a book
  const getChaptersWithPerushim = (bookEnglish) => {
    const chapters = [...new Set(perushimData.filter(p => p.book === bookEnglish).map(p => p.chapter))];
    return chapters.sort((a, b) => a - b);
  };

  // Check if a book has any perushim
  const bookHasPerushim = (bookEnglish) => {
    return perushimData.some(p => p.book === bookEnglish);
  };

  return (
    <div
      className="min-h-screen flex flex-col splash-enter"
      dir="rtl"
      style={{
        backgroundImage: 'url(/home-bg.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#050508',
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <h2
          className="text-gold text-3xl"
          style={{ fontFamily: 'var(--font-title)' }}
        >
          פירושים
        </h2>
        <button
          onClick={onBack}
          className="text-white/40 hover:text-gold cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 text-lg font-ui px-4 py-2 border border-white/10 rounded-lg hover:border-gold/30"
        >
          חזרה
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto">

          {/* If viewing a specific perush — centered modal overlay */}
          {activePerush && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => { setActivePerush(null); setIsEditing(false); }}>
              <div
                className="border border-gold/20 rounded-2xl p-8 bg-[#0a0e1a] overflow-y-auto flex flex-col"
                style={{ width: '80%', height: '80%' }}
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="text-gold/50 text-sm font-ui">
                    {books.find(b => b.english === activePerush.book)?.hebrew} | פרק {hn(activePerush.chapter)} | פסוקים {activePerush.verse}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (isEditing) {
                          // Save changes
                          const idx = perushimData.findIndex(p => p === activePerush);
                          if (idx !== -1) {
                            perushimData[idx].title = editTitle;
                            perushimData[idx].content = editContent;
                            setActivePerush({ ...perushimData[idx] });
                          }
                          setIsEditing(false);
                        } else {
                          // Enter edit mode
                          setEditTitle(activePerush.title);
                          setEditContent(activePerush.content);
                          setIsEditing(true);
                        }
                      }}
                      className={`cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 text-sm font-ui px-3 py-1 border rounded-lg ${
                        isEditing
                          ? 'text-gold border-gold/40 hover:bg-gold/10'
                          : 'text-white/40 border-white/10 hover:text-gold hover:border-gold/30'
                      }`}
                    >
                      {isEditing ? 'שמור' : 'עריכה'}
                    </button>
                    {isEditing && (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-white/40 hover:text-white/60 cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 text-sm font-ui px-3 py-1 border border-white/10 rounded-lg"
                      >
                        ביטול
                      </button>
                    )}
                    <button
                      onClick={() => { setActivePerush(null); setIsEditing(false); }}
                      className="text-white/40 hover:text-gold cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 text-sm font-ui px-3 py-1 border border-white/10 rounded-lg hover:border-gold/30"
                    >
                      סגור ✕
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-gold text-2xl mb-6 bg-transparent border-b border-gold/30 outline-none w-full px-2 py-1"
                      style={{ fontFamily: 'var(--font-title)' }}
                      dir="rtl"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 text-white/70 text-lg leading-relaxed font-torah bg-transparent border border-white/10 rounded-xl outline-none w-full p-4 resize-none focus:border-gold/30 transition-colors duration-300"
                      dir="rtl"
                    />
                  </>
                ) : (
                  <>
                    <h3
                      className="text-gold text-2xl mb-6"
                      style={{ fontFamily: 'var(--font-title)' }}
                    >
                      {activePerush.title}
                    </h3>
                    <div className="text-white/70 text-lg leading-relaxed font-torah whitespace-pre-line">
                      {activePerush.content}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Main view: Book tabs + chapter accordions */}
          {!activePerush && (
            <>
              {/* Book tabs */}
              <div className="flex gap-3 justify-center flex-wrap mb-8">
                {books.map((book) => {
                  const hasContent = bookHasPerushim(book.english);
                  return (
                    <button
                      key={book.english}
                      onClick={() => {
                        setActiveBook(activeBook === book.english ? null : book.english);
                        setActiveChapter(null);
                      }}
                      className={`px-6 py-3 rounded-xl border text-xl cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 ${
                        activeBook === book.english
                          ? 'border-gold/50 bg-gold/10 text-gold shadow-[0_0_20px_rgba(212,168,67,0.1)]'
                          : hasContent
                            ? 'border-white/15 text-white/50 hover:border-white/30 hover:text-white/70'
                            : 'border-white/5 text-white/20'
                      }`}
                      style={{ fontFamily: 'var(--font-title)' }}
                    >
                      {book.hebrew}
                      {hasContent && (
                        <span className="inline-block w-1.5 h-1.5 bg-gold rounded-full mr-2 align-middle" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Chapter accordions for selected book */}
              {activeBook && (
                <div className="space-y-3 animate-fadeIn">
                  {(() => {
                    const chaptersWithContent = getChaptersWithPerushim(activeBook);
                    const book = books.find(b => b.english === activeBook);
                    const allChapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

                    if (chaptersWithContent.length === 0) {
                      return (
                        <div className="text-center text-white/20 font-ui py-12 text-lg">
                          עדיין אין פירושים ל{book.hebrew}
                        </div>
                      );
                    }

                    return allChapters.map((chNum) => {
                      const chapterPerushim = getPerushim(activeBook, chNum);
                      if (chapterPerushim.length === 0) return null;

                      const isOpen = activeChapter === chNum;
                      return (
                        <div
                          key={chNum}
                          className="border border-white/8 rounded-xl overflow-hidden"
                          style={{
                            background: 'linear-gradient(180deg, rgba(20,28,50,0.72), rgba(10,14,26,0.85))',
                          }}
                        >
                          {/* Chapter header — accordion toggle */}
                          <button
                            onClick={() => setActiveChapter(isOpen ? null : chNum)}
                            className="w-full flex items-center justify-between px-6 py-4 cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:bg-white/5"
                          >
                            <span className="text-gold text-lg" style={{ fontFamily: 'var(--font-title)' }}>
                              פרק {hn(Number(chNum))}
                            </span>
                            <span className="flex items-center gap-3">
                              <span className="text-white/30 text-sm font-ui">
                                {chapterPerushim.length} {chapterPerushim.length === 1 ? 'פירוש' : 'פירושים'}
                              </span>
                              <span className={`text-gold/50 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
                                ◄
                              </span>
                            </span>
                          </button>

                          {/* Expanded: list of perushim in this chapter */}
                          {isOpen && (
                            <div className="border-t border-white/5 px-6 py-3 space-y-2">
                              {chapterPerushim.map((perush, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setActivePerush(perush)}
                                  className="w-full text-right px-4 py-3 rounded-lg cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:bg-gold/5 border border-transparent hover:border-gold/20 flex items-center justify-between"
                                >
                                  <span className="text-white/60 font-ui text-base">
                                    {perush.title}
                                  </span>
                                  <span className="text-white/25 text-sm font-ui">
                                    פסוקים {perush.verse}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* No book selected hint */}
              {!activeBook && (
                <div className="text-center text-white/20 font-ui py-16 text-lg">
                  בחר ספר כדי לראות את הפירושים
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
