/* ============================================================
   ReaderView.jsx — Main reading view
   Contains: top bar (mobile + desktop), text display (mode 1 + mode 2),
   border adjustment, bottom bar (audio + navigation), settings panel
   ============================================================ */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSefaria } from '../hooks/useSefaria';
import { useAudio } from '../hooks/useAudio';
import { saveLastPosition, getSettings, saveSettings } from '../utils/storage';
import { toHebrewNumeral } from '../utils/hebrewNumerals';
import { parseSearchRef } from '../utils/searchRef';
import { isAdmin } from '../utils/admin';
import torahStructure from '../data/torahStructure.json';
import SpeedControl from './SpeedControl';
import SettingsPanel from './SettingsPanel';

// CombiNumerals font character mapping (from official guide):
// Single digits 1-9: qwertyuio row, 0: p
// 10-19: asdfghjkl; row (special alternates, better spacing than 1+Shift combos)
// 20-99: tens digit key + Shift-ones key
const COMBI_SINGLE = { 1:'q', 2:'w', 3:'e', 4:'r', 5:'t', 6:'y', 7:'u', 8:'i', 9:'o' };
const COMBI_TEENS = { 10:'a', 11:'s', 12:'d', 13:'f', 14:'g', 15:'h', 16:'j', 17:'k', 18:'l', 19:';' };
const COMBI_SHIFT = { 0:')', 1:'!', 2:'@', 3:'#', 4:'$', 5:'%', 6:'^', 7:'&', 8:'*', 9:'(' };
function toCombiNumerals(n) {
  if (n < 1 || n > 99) return String(n);
  if (n <= 9) return COMBI_SINGLE[n];
  if (n <= 19) return COMBI_TEENS[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return String(tens) + COMBI_SHIFT[ones];
}

export default function ReaderView({ book, chapter, initialVerse, onBack, onNavigate }) {
  const { fetchChapter, loading, error } = useSefaria();
  const [verses, setVerses] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(0);
  const [currentWord, setCurrentWord] = useState(0);
  const [settings, setSettings] = useState(getSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState(1);
  const [showTopBar, setShowTopBar] = useState(true);
  const [showBottomBar, setShowBottomBar] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [magnifyMode, setMagnifyMode] = useState(false);
  const [adjustingBorders, setAdjustingBorders] = useState(false);
  const [parchmentMode, setParchmentMode] = useState(true);
  const [isMobile] = useState(() => window.innerWidth <= 768);
  const audio = useAudio(book.english, chapter);
  const audioSliderRef = useRef(null);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const timerRef = useRef(null);
  const verseRefs = useRef([]);
  const wordRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startPadding: 0 });
  const [mirroredBg, setMirroredBg] = useState(null);
  const [syncEditMode, setSyncEditMode] = useState(false);
  const [syncEditsCount, setSyncEditsCount] = useState(0);
  const [syncSaveStatus, setSyncSaveStatus] = useState('');
  const [verseTranslations, setVerseTranslations] = useState({}); // { verseIndex: translationText }
  const [savedTranslations, setSavedTranslations] = useState(null); // loaded from file: { "0": "...", "1": "...", ... }
  const [showSavedTranslations, setShowSavedTranslations] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [editingTranslations, setEditingTranslations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  const handleBottomSearch = () => {
    const result = parseSearchRef(searchQuery, torahStructure.books);
    if (result.error !== undefined) {
      setSearchError(result.error);
      setTimeout(() => setSearchError(''), 2800);
      return;
    }
    setSearchError('');
    setSearchQuery('');
    if (onNavigate) onNavigate(result.book, result.chapter);
  };

  // Create mirrored parchment background tile
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext('2d');
      // Draw original on top
      ctx.drawImage(img, 0, 0);
      // Draw flipped copy below
      ctx.save();
      ctx.translate(0, img.height * 2);
      ctx.scale(1, -1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      setMirroredBg(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = '/reader-bg.png';
  }, []);

  // Fetch chapter text
  useEffect(() => {
    let cancelled = false;
    fetchChapter(book.english, chapter).then((data) => {
      if (!cancelled && data.length > 0) {
        setVerses(data);
        setCurrentVerse(0);
        setCurrentWord(0);
      }
    });
    return () => { cancelled = true; };
  }, [book.english, chapter, fetchChapter]);

  // Load saved translations for this chapter (if they exist)
  useEffect(() => {
    setSavedTranslations(null);
    setShowSavedTranslations(false);
    fetch(`/translations/${book.english}_${chapter}.json`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setSavedTranslations(data))
      .catch(() => setSavedTranslations(null));
  }, [book.english, chapter]);

  // Save position
  useEffect(() => {
    if (verses.length > 0) {
      saveLastPosition({
        bookEnglish: book.english,
        bookHebrew: book.hebrew,
        chapter,
        verse: currentVerse + 1,
      });
    }
  }, [book, chapter, currentVerse, verses.length]);

  // Scroll to initialVerse when verses first load
  useEffect(() => {
    if (initialVerse && initialVerse >= 1 && verses.length > 0) {
      const idx = initialVerse - 1;
      if (verseRefs.current[idx]) {
        setTimeout(() => {
          verseRefs.current[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [verses.length, initialVerse]);

  // Auto-scroll to current verse (mode 1) or current word (mode 2)
  useEffect(() => {
    if (viewMode === 1 && verseRefs.current[currentVerse]) {
      verseRefs.current[currentVerse].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentVerse, viewMode]);

  // Auto-scroll lock: stays glued to highlighted words until user scrolls.
  // Resets to glued every time user presses play.
  const autoScrollRef = useRef(true);
  const scrollingByCodeRef = useRef(false);

  // Re-enable auto-scroll every time play starts
  useEffect(() => {
    if (audio.isPlaying) {
      autoScrollRef.current = true;
    }
  }, [audio.isPlaying]);

  // Detect user scroll — disable auto-scroll (ignore programmatic scrollIntoView)
  useEffect(() => {
    const disableAutoScroll = () => {
      if (scrollingByCodeRef.current) return;
      if (audio.isPlaying) autoScrollRef.current = false;
    };
    window.addEventListener('wheel', disableAutoScroll, { passive: true });
    window.addEventListener('touchmove', disableAutoScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', disableAutoScroll);
      window.removeEventListener('touchmove', disableAutoScroll);
    };
  }, [audio.isPlaying]);

  // Auto-scroll during audio sync playback (only when auto-scroll is active)
  // Gentle controlled scroll with custom duration
  const scrollAnimRef = useRef(null);

  const smoothScrollTo = (el, duration) => {
    if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    const rect = el.getBoundingClientRect();
    const targetY = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
    const startY = window.scrollY;
    const diff = targetY - startY;
    if (Math.abs(diff) < 3) return;
    const startTime = performance.now();
    // Starts very slow, gently picks up speed, then eases to a stop
    const ease = (t) => t * t * (3 - 2 * t);
    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      scrollingByCodeRef.current = true;
      window.scrollTo(0, startY + diff * ease(progress));
      if (progress < 1) {
        scrollAnimRef.current = requestAnimationFrame(animate);
      } else {
        scrollAnimRef.current = null;
        setTimeout(() => { scrollingByCodeRef.current = false; }, 100);
      }
    };
    scrollAnimRef.current = requestAnimationFrame(animate);
  };

  // Mode 1: snappy scroll with pre-scroll
  const preScrollTimerRef = useRef(null);
  useEffect(() => {
    if (preScrollTimerRef.current) {
      clearTimeout(preScrollTimerRef.current);
      preScrollTimerRef.current = null;
    }
    if (viewMode !== 1 || !audio.isPlaying || !audio.hasSync || audio.activeVerse < 0 || !autoScrollRef.current) return;

    const el = verseRefs.current[audio.activeVerse];
    if (el) smoothScrollTo(el, 600);

    // Pre-scroll to next verse
    if (audio.syncData) {
      const verseWords = audio.syncData.filter(w => w.v === audio.activeVerse);
      const lastWord = verseWords[verseWords.length - 1];
      const nextEl = verseRefs.current[audio.activeVerse + 1];
      if (lastWord && nextEl && audio.currentTime < lastWord.e) {
        const timeUntilEnd = (lastWord.e - audio.currentTime) * 1000;
        const preScrollDelay = Math.max(0, timeUntilEnd - 500);
        preScrollTimerRef.current = setTimeout(() => {
          if (!autoScrollRef.current) return;
          smoothScrollTo(nextEl, 600);
        }, preScrollDelay);
      }
    }

    return () => {
      if (preScrollTimerRef.current) {
        clearTimeout(preScrollTimerRef.current);
        preScrollTimerRef.current = null;
      }
    };
  }, [audio.activeVerse, audio.isPlaying, audio.hasSync, viewMode]);

  // Mode 2: continuous proportional scroll — keeps highlighted word centered
  const mode2ScrollRef = useRef(null);
  useEffect(() => {
    if (mode2ScrollRef.current) {
      cancelAnimationFrame(mode2ScrollRef.current);
      mode2ScrollRef.current = null;
    }
    if (viewMode !== 2 || !audio.isPlaying || !audio.hasSync) return;

    const tick = () => {
      if (!autoScrollRef.current || !wordRef.current) {
        mode2ScrollRef.current = requestAnimationFrame(tick);
        return;
      }
      const rect = wordRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const centerY = rect.top + rect.height / 2;
      const targetY = vh / 2;
      const diff = centerY - targetY;
      if (Math.abs(diff) > 2) {
        scrollingByCodeRef.current = true;
        // Proportional: close 8% of the gap each frame for smooth continuous motion
        window.scrollBy(0, diff * 0.08);
      } else {
        scrollingByCodeRef.current = false;
      }
      mode2ScrollRef.current = requestAnimationFrame(tick);
    };
    mode2ScrollRef.current = requestAnimationFrame(tick);

    return () => {
      if (mode2ScrollRef.current) {
        cancelAnimationFrame(mode2ScrollRef.current);
        mode2ScrollRef.current = null;
      }
      scrollingByCodeRef.current = false;
    };
  }, [audio.isPlaying, audio.hasSync, viewMode]);

  useEffect(() => {
    if (!audio.isPlaying && viewMode === 2 && wordRef.current) {
      wordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentWord, currentVerse, viewMode, audio.isPlaying]);

  // Word-by-word highlight timer
  const currentVerseRef = useRef(currentVerse);
  currentVerseRef.current = currentVerse;

  useEffect(() => {
    if (!playing || verses.length === 0) {
      clearInterval(timerRef.current);
      return;
    }
    const msPerWord = 60000 / settings.speed;
    timerRef.current = setInterval(() => {
      const vi = currentVerseRef.current;
      const verse = verses[vi];
      if (!verse) return;

      setCurrentWord((prev) => {
        if (prev >= verse.words.length - 1) {
          // Last word of this verse — advance to next verse
          if (vi >= verses.length - 1) {
            setPlaying(false);
            return prev;
          }
          setCurrentVerse(vi + 1);
          return 0;
        }
        return prev + 1;
      });
    }, msPerWord);
    return () => clearInterval(timerRef.current);
  }, [playing, verses, settings.speed]);

  // Translate selected text via Claude API — interlinear (per verse)
  // Save edited translations to file
  const saveTranslationEdits = async () => {
    if (!isAdmin()) return; // admin-only: prevents visitors from overwriting translations
    if (!savedTranslations) return;
    try {
      const resp = await fetch('/api/save-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: book.english, chapter, translations: savedTranslations }),
      });
      if (resp.ok) {
        setEditingTranslations(false);
      }
    } catch { /* ignore */ }
  };

  // Update a single verse translation while editing
  const updateVerseTranslation = (vIndex, newText) => {
    setSavedTranslations(prev => ({ ...prev, [String(vIndex)]: newText }));
  };

  const handleTranslate = async () => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (!text) {
      // No selection — toggle visibility of existing translations
      setShowTranslations(prev => !prev);
      return;
    }
    // Admin-only: Claude API costs money per call
    if (!isAdmin()) return;

    // Figure out which verses are selected by checking which verse divs contain the selection
    const range = sel.getRangeAt(0);
    const selectedVerses = [];
    for (let i = 0; i < verses.length; i++) {
      const el = verseRefs.current[i];
      if (el && range.intersectsNode(el)) {
        selectedVerses.push(i);
      }
    }
    if (selectedVerses.length === 0) return;

    setTranslating(true);
    setShowTranslations(true);

    // Mark selected verses as loading
    setVerseTranslations(prev => {
      const next = { ...prev };
      for (const vi of selectedVerses) next[vi] = 'מתרגם...';
      return next;
    });

    // Build numbered verse list and send as one request
    const verseTexts = selectedVerses.map(vi => `[${vi + 1}] ${verses[vi].words.join(' ')}`).join('\n');

    try {
      const resp = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: verseTexts, verseCount: selectedVerses.length }),
      });
      const data = await resp.json();
      if (data.error) {
        setVerseTranslations(prev => {
          const next = { ...prev };
          for (const vi of selectedVerses) next[vi] = `שגיאה: ${data.error}`;
          return next;
        });
      } else {
        // Split response by [N] markers
        const parts = data.translation.split(/\[(\d+)\]/).filter(s => s.trim());
        const parsed = {};
        for (let i = 0; i < parts.length - 1; i += 2) {
          const num = parseInt(parts[i]) - 1;
          if (selectedVerses.includes(num)) {
            parsed[num] = parts[i + 1].trim();
          }
        }
        if (Object.keys(parsed).length > 0) {
          setVerseTranslations(prev => ({ ...prev, ...parsed }));
        } else {
          // Fallback: split evenly by newlines
          const lines = data.translation.split('\n').filter(l => l.trim());
          selectedVerses.forEach((vi, idx) => {
            setVerseTranslations(prev => ({ ...prev, [vi]: lines[idx]?.trim() || data.translation.trim() }));
          });
        }
      }
    } catch {
      setVerseTranslations(prev => {
        const next = { ...prev };
        for (const vi of selectedVerses) next[vi] = 'שגיאה בחיבור לשרת';
        return next;
      });
    }
    setTranslating(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space') { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); if (currentVerse > 0) { setCurrentVerse((v) => v - 1); setCurrentWord(0); } }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); if (currentVerse < verses.length - 1) { setCurrentVerse((v) => v + 1); setCurrentWord(0); } }
      else if (e.code === 'Escape') { onBack(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentVerse, verses.length, onBack]);

  const updateSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const textPadding = isMobile ? Math.min(settings.textPadding || 50, 15) : (settings.textPadding || 50);

  // Border drag handlers
  const handleDragStart = useCallback((e, side) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    dragRef.current = { active: true, side, startX: clientX, startPadding: textPadding };

    const handleMove = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const delta = cx - dragRef.current.startX;
      // If dragging right handle: moving right = more padding, moving left = less
      // If dragging left handle: moving left = more padding, moving right = less
      const direction = dragRef.current.side === 'right' ? -1 : 1;
      const newPadding = Math.max(10, Math.min(300, dragRef.current.startPadding + delta * direction));
      updateSettings({ ...settings, textPadding: Math.round(newPadding) });
    };

    const handleEnd = () => {
      dragRef.current.active = false;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
  }, [textPadding, settings, updateSettings]);

  const goToNextChapter = () => { if (chapter < book.chapters) onNavigate(book, chapter + 1); };
  const goToPrevChapter = () => { if (chapter > 1) onNavigate(book, chapter - 1); };

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Sync Edit: click a word to set its start time to current audio position ──
  const handleSyncEditClick = (verseIndex, wordIndex) => {
    if (!isAdmin()) return; // admin-only: prevents visitors from mutating sync timings
    if (!syncEditMode || !audio.syncData) return;
    const t = audio.currentTime;
    // Find the sync entry for this word
    const newSync = audio.syncData.map(entry => {
      if (entry.v === verseIndex && entry.w === wordIndex) {
        return { ...entry, s: Math.round(t * 100) / 100 };
      }
      return entry;
    });
    // Fix end times: each word's end = next word's start (unless it's the last)
    for (let i = 0; i < newSync.length; i++) {
      if (newSync[i].v === verseIndex && newSync[i].w === wordIndex) {
        if (i + 1 < newSync.length) {
          newSync[i].e = newSync[i + 1].s;
        } else {
          newSync[i].e = Math.round((t + 0.5) * 100) / 100;
        }
        // Also fix the previous word's end time to this word's new start
        if (i > 0) {
          newSync[i - 1].e = newSync[i].s;
        }
        break;
      }
    }
    audio.setSyncData(newSync);
    setSyncEditsCount(prev => prev + 1);
  };

  const saveSyncEdits = async () => {
    if (!isAdmin()) return; // admin-only: prevents visitors from overwriting sync files
    if (!audio.syncData) return;
    setSyncSaveStatus('שומר...');
    try {
      const resp = await fetch('/api/save-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book: book.english,
          chapter,
          syncData: audio.syncData,
        }),
      });
      if (resp.ok) {
        setSyncSaveStatus('נשמר!');
        setSyncEditsCount(0);
        setTimeout(() => setSyncSaveStatus(''), 2000);
      } else {
        setSyncSaveStatus('שגיאה בשמירה');
      }
    } catch {
      setSyncSaveStatus('שגיאה בחיבור לשרת');
      setTimeout(() => setSyncSaveStatus(''), 4000);
    }
  };

  // Click a word to seek audio to that word's timestamp (with 0.7s offset so you hear the full word)
  // If audio is currently playing, keep playing from the new position.
  // If audio is paused/stopped, just seek without starting playback.
  const handleWordSeek = (verseIndex, wordIndex) => {
    if (!audio.hasSync || !audio.syncData) return;
    setCurrentVerse(verseIndex);
    setCurrentWord(wordIndex);
    const entry = audio.syncData.find(e => e.v === verseIndex && e.w === wordIndex);
    if (entry) {
      const seekTime = Math.max(0, entry.s - 0.7);
      audio.seek(seekTime);
      // Only auto-play if audio is already playing
    }
  };

  const getWordClass = (verseIndex, wordIndex) => {
    // Audio sync highlighting (takes priority when audio is playing with sync data)
    if (audio.isPlaying && audio.hasSync && audio.activeVerse >= 0) {
      if (verseIndex === audio.activeVerse && wordIndex === audio.activeWord) return 'word-highlight';
      if (verseIndex < audio.activeVerse || (verseIndex === audio.activeVerse && wordIndex < audio.activeWord)) return 'word-read';
      return 'word-upcoming';
    }
    // Text play highlighting (manual speed-based)
    if (verseIndex !== currentVerse) return '';
    if (!playing) return '';
    if (wordIndex < currentWord) return 'word-read';
    if (wordIndex === currentWord) return 'word-highlight';
    return 'word-upcoming';
  };

  const isCurrentWord = (vIndex, wIndex) => {
    // During audio sync playback, track the audio-highlighted word
    if (audio.isPlaying && audio.hasSync && audio.activeVerse >= 0) {
      return vIndex === audio.activeVerse && wIndex === audio.activeWord;
    }
    // During manual text-play
    return vIndex === currentVerse && wIndex === currentWord && playing;
  };

  // Glow effect for "show all text" mode
  const getVerseGlow = (vIndex) => {
    const activeV = (audio.isPlaying && audio.hasSync && audio.activeVerse >= 0) ? audio.activeVerse : currentVerse;
    if (vIndex !== activeV) return 'none';
    if (parchmentMode) {
      return '0 0 12px rgba(160, 100, 20, 0.7), 0 0 30px rgba(160, 100, 20, 0.4)';
    }
    return '0 0 12px rgba(212, 168, 67, 0.6), 0 0 30px rgba(212, 168, 67, 0.3)';
  };

  // Focus mode blur
  const getVerseBlur = (vIndex) => {
    if (!focusMode) return 0;
    const activeV = (audio.isPlaying && audio.hasSync && audio.activeVerse >= 0) ? audio.activeVerse : currentVerse;
    const distance = Math.abs(vIndex - activeV);
    if (distance === 0) return 0;
    if (distance === 1) return 1.5;
    if (distance === 2) return 3.5;
    if (distance === 3) return 5;
    return 7;
  };

  // Magnify mode scale
  const getVerseScale = (vIndex) => {
    if (!magnifyMode) return 1;
    const activeV = (audio.isPlaying && audio.hasSync && audio.activeVerse >= 0) ? audio.activeVerse : currentVerse;
    return vIndex === activeV ? 1.12 : 1;
  };

  // Combined verse style
  const getVerseStyle = (vIndex, baseFontSize) => {
    const blur = getVerseBlur(vIndex);
    const scale = getVerseScale(vIndex);
    const style = { fontSize: `${baseFontSize}px` };
    const filters = [];
    if (blur > 0) filters.push(`blur(${blur}px)`);
    if (filters.length > 0) style.filter = filters.join(' ');
    if (scale !== 1) style.transform = `scale(${scale})`;
    return style;
  };

  const fontSize = isMobile ? settings.fontSize * 0.75 + 4 : settings.fontSize + 4;
  const hn = (n) => settings.hebrewNumerals ? toHebrewNumeral(n) : n;

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-gold/60 font-ui text-lg">טוען...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 font-ui">שגיאה בטעינת הטקסט</div>
        <button onClick={onBack} className="text-gold/60 hover:text-gold cursor-pointer font-ui">חזרה</button>
      </div>
    );
  }

  /* ======================== RENDER ======================== */
  return (
    <>
      {/* ======== TOP BAR (fixed, z-50) ======== */}
      {showTopBar ? (
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ backgroundColor: '#0a0e1a' }}>

          {/* -------- MOBILE TOP BAR -------- */}
          {isMobile ? (
          <div dir="rtl">
            {/* MOBILE ROW 1 */}
            <div className="h-10 flex items-center justify-between px-3">
              <button onClick={onBack} className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center"
                style={{ width: '35px', height: '35px' }}>
                <img src="/icon-back.png" alt="חזרה" style={{ width: '35px', height: '35px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(2) translateY(-0.6px)', transformOrigin: 'center' }} />
              </button>
              <div className="relative flex items-center justify-center flex-1">
                <img src="/icon-chapter-verse.png" alt="" className="absolute" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(5) translateY(0.5px)', transformOrigin: 'center' }} />
                <div className="relative z-10 text-center px-6 py-1">
                  <span className="font-torah text-gold text-base">{book.hebrew}</span>
                  <span className="text-white/30 mx-1">|</span>
                  <span className="text-white/50 font-ui text-sm">פרק {hn(chapter)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setParchmentMode(!parchmentMode)}
                  className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center rounded-md border"
                  style={{
                    width: '22px', height: '22px',
                    borderColor: parchmentMode ? 'rgba(212,168,67,0.4)' : 'rgba(255,255,255,0.15)',
                    backgroundColor: parchmentMode ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.05)',
                  }}
                  title={parchmentMode ? 'מצב כהה' : 'מצב קלף'}
                >
                  <span style={{ fontSize: '11px', lineHeight: 1 }}>{parchmentMode ? '🌙' : '📜'}</span>
                </button>
                <button onClick={() => setShowSettings(!showSettings)}
                  className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center"
                  style={{ width: '35px', height: '35px' }}>
                  <img src="/icon-settings.png" alt="הגדרות" style={{ width: '35px', height: '35px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(4.12) translateY(0.4px)', transformOrigin: 'center' }} />
                </button>
              </div>
            </div>
            {/* MOBILE ROW 2 */}
            <div className="h-8 flex items-center justify-center gap-2 px-3 border-t border-white/5">
              <button onClick={() => setViewMode(1)}
                className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center"
                style={{ width: '20px', height: '20px' }}>
                <img src="/icon-1.png" alt="תצוגה 1" style={{ width: '20px', height: '20px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(3)', transformOrigin: 'center', opacity: viewMode === 1 ? 1 : 0.4, transition: 'opacity 0.3s' }} />
              </button>
              <button onClick={() => setViewMode(2)}
                className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center"
                style={{ width: '20px', height: '20px' }}>
                <img src="/icon-2.png" alt="תצוגה 2" style={{ width: '20px', height: '20px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(3)', transformOrigin: 'center', opacity: viewMode === 2 ? 1 : 0.4, transition: 'opacity 0.3s' }} />
              </button>
              <div className="w-px h-3 bg-white/10" />
              <button onClick={() => setFocusMode(f => !f)}
                className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center"
                style={{ width: '20px', height: '20px' }}>
                <img src="/icon-eye.png" alt="מיקוד" style={{ width: '20px', height: '20px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(3.5)', transformOrigin: 'center', opacity: focusMode ? 1 : 0.4, transition: 'opacity 0.3s' }} />
              </button>
              <button onClick={() => setMagnifyMode(m => !m)}
                className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center"
                style={{ width: '20px', height: '20px' }}>
                <img src="/icon-magni.png" alt="הגדלה" style={{ width: '20px', height: '20px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(2.2)', transformOrigin: 'center', opacity: magnifyMode ? 1 : 0.4, transition: 'opacity 0.3s' }} />
              </button>
              <div className="w-px h-3 bg-white/10" />
              {/* MOBILE: Font slider */}
              <div className="flex items-center gap-1 w-16" style={{ transform: 'translateX(-44px) translateY(-4.5px)' }}>
                {/* Small alef on right */}
                <div style={{ width: '10px', height: '10px' }}>
                  <img src="/icon-alef.png" alt="א" style={{ width: '10px', height: '10px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(2) translateX(12px) translateY(3px)', transformOrigin: 'center' }} />
                </div>
                <div className="relative flex-1" style={{ height: '20px' }}>
                  <img src="/icon-slider.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', position: 'absolute', left: 0, top: 0, transform: 'scaleX(3.5) scaleY(2.5)', transformOrigin: 'center' }} />
                  <input
                    type="range"
                    min={18}
                    max={80}
                    value={settings.fontSize}
                    onChange={(e) => updateSettings({ ...settings, fontSize: Number(e.target.value) })}
                    className="mobile-font-slider absolute z-10 appearance-none bg-transparent outline-none cursor-pointer"
                    style={{ height: '20px', WebkitAppearance: 'none', background: 'transparent', top: '0.5px', width: 'calc(100% + 78px)', marginLeft: '-39px', marginRight: '-39px' }}
                  />
                  <style>{`
                    .mobile-font-slider::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      width: 31px;
                      height: 31px;
                      background: url('/icon-slider-button.png') center/contain no-repeat;
                      cursor: pointer;
                      margin-top: 4.5px;
                    }
                    .mobile-font-slider::-moz-range-thumb {
                      width: 31px;
                      height: 31px;
                      background: url('/icon-slider-button.png') center/contain no-repeat;
                      cursor: pointer;
                      border: none;
                    }
                    .mobile-font-slider::-webkit-slider-runnable-track {
                      background: transparent;
                      height: 20px;
                    }
                    .mobile-font-slider::-moz-range-track {
                      background: transparent;
                      height: 20px;
                    }
                  `}</style>
                </div>
                {/* Large alef on left */}
                <div style={{ width: '12px', height: '12px' }}>
                  <img src="/icon-alef.png" alt="א" style={{ width: '12px', height: '12px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(3) translateX(-8px) translateY(1.9px)', transformOrigin: 'center' }} />
                </div>
              </div>
              <button onClick={() => setShowTopBar(false)}
                className="text-white/20 hover:text-white/50 cursor-pointer text-xs transition-colors"
                style={{ transform: 'translateX(-73.4px) translateY(-0.5px)' }}>
                ▲
              </button>
            </div>
          </div>
          ) : (
          /* -------- DESKTOP TOP BAR -------- */
          <div className="h-16 flex items-center px-2" dir="rtl">
            <button onClick={onBack} className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center"
              style={{ width: '70px', height: '70px' }}>
              <img src="/icon-back.png" alt="חזרה" style={{ width: '70px', height: '70px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(2.15) translateY(-1.5px)', transformOrigin: 'center' }} />
            </button>

            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1" style={{ transform: 'translateX(100px) translateY(5px)' }}>
                  <button
                    onClick={() => setViewMode(1)}
                    className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center"
                    style={{ width: '30px', height: '30px' }}
                  >
                    <img src="/icon-1.png" alt="תצוגה 1" style={{ width: '30px', height: '30px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(4) translateX(3px)', transformOrigin: 'center', opacity: viewMode === 1 ? 1 : 0.4, transition: 'opacity 0.3s' }} />
                  </button>
                  <button
                    onClick={() => setViewMode(2)}
                    className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center"
                    style={{ width: '30px', height: '30px' }}
                  >
                    <img src="/icon-2.png" alt="תצוגה 2" style={{ width: '30px', height: '30px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(4)', transformOrigin: 'center', opacity: viewMode === 2 ? 1 : 0.4, transition: 'opacity 0.3s' }} />
                  </button>
                </div>

                {/* Separator */}
                <div className="w-px h-4 bg-white/10 mx-1" />

                <button
                  onClick={() => setFocusMode((f) => !f)}
                  title="מצב מיקוד"
                  className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center rounded-full"
                  style={{ width: '35px', height: '35px' }}
                >
                  <img src="/icon-eye.png" alt="מיקוד" style={{ width: '35px', height: '35px', objectFit: 'contain', pointerEvents: 'none', transform: `scale(4.85) translateY(1.1px)`, transformOrigin: 'center', opacity: focusMode ? 1 : 0.4, transition: 'opacity 0.3s' }} />
                </button>

                {/* Spacer between eye and magnify */}
                <div style={{ width: '8px' }} />

                <button
                  onClick={() => setMagnifyMode((m) => !m)}
                  title="מצב הגדלה"
                  className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center rounded-full"
                  style={{ width: '35px', height: '35px' }}
                >
                  <img src="/icon-magni.png" alt="הגדלה" style={{ width: '35px', height: '35px', objectFit: 'contain', pointerEvents: 'none', transform: `scale(2.98) translateX(-2.5px)`, transformOrigin: 'center', opacity: magnifyMode ? 1 : 0.4, transition: 'opacity 0.3s' }} />
                </button>
              </div>
            </div>

            <div className="w-px h-6 mx-4" style={{ backgroundColor: 'rgba(212,168,67,0.4)' }} />

            <div className="relative flex items-center justify-center">
              <img src="/icon-chapter-verse.png" alt="" className="absolute" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(6.35) translateY(0.5px)', transformOrigin: 'center' }} />
              <div className="relative z-10 text-center px-10 py-2">
                <span className="font-torah text-gold text-2xl">{book.hebrew}</span>
                <span className="text-white/30 mx-3">|</span>
                <span className="text-white/50 font-ui text-lg">פרק {hn(chapter)}</span>
              </div>
            </div>

            <div className="w-px h-6 mx-4" style={{ backgroundColor: 'rgba(212,168,67,0.4)' }} />

            {/* DESKTOP: Font slider */}
            <div className="flex-1 flex justify-center">
              <div className="relative flex items-center" style={{ width: '120px', height: '30px', transform: 'translateY(-9px)' }}>
                {/* Small alef on right edge */}
                <img src="/icon-alef.png" alt="א" className="absolute" style={{ width: '15px', height: '15px', objectFit: 'contain', pointerEvents: 'none', right: '-47px', top: '50%', transform: 'translateY(calc(-50% + 12.5px)) scale(3)', transformOrigin: 'center' }} />
                {/* Slider track image — scaled up like other icons */}
                <img src="/icon-slider.png" alt="" style={{ width: '100%', height: '30px', objectFit: 'contain', pointerEvents: 'none', position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%) scaleX(5.2) scaleY(3.9)', transformOrigin: 'center' }} />
                {/* Invisible range input on top */}
                <input
                  type="range"
                  min={18}
                  max={80}
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ ...settings, fontSize: Number(e.target.value) })}
                  className="relative z-10 appearance-none bg-transparent outline-none cursor-pointer"
                  style={{ height: '30px', WebkitAppearance: 'none', background: 'transparent', width: 'calc(100% + 122px)', marginLeft: '-61px', marginRight: '-61px' }}
                />
                <style>{`
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 69px;
                    height: 69px;
                    background: url('/icon-slider-button.png') center/contain no-repeat;
                    cursor: pointer;
                    position: relative;
                    z-index: 20;
                    margin-top: 7.2px;
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 69px;
                    height: 69px;
                    background: url('/icon-slider-button.png') center/contain no-repeat;
                    cursor: pointer;
                    border: none;
                  }
                  input[type="range"]::-webkit-slider-runnable-track {
                    background: transparent;
                    height: 30px;
                  }
                  input[type="range"]::-moz-range-track {
                    background: transparent;
                    height: 30px;
                  }
                `}</style>
                {/* Large alef on left edge */}
                <img src="/icon-alef.png" alt="א" className="absolute" style={{ width: '15px', height: '15px', objectFit: 'contain', pointerEvents: 'none', left: '-48px', top: '50%', transform: 'translateY(calc(-50% + 12.5px)) scale(5)', transformOrigin: 'center' }} />
              </div>
            </div>

            <button onClick={() => setParchmentMode(!parchmentMode)}
              className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center rounded-lg border"
              style={{
                width: '36px', height: '36px',
                borderColor: parchmentMode ? 'rgba(212,168,67,0.4)' : 'rgba(255,255,255,0.15)',
                backgroundColor: parchmentMode ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.05)',
              }}
              title={parchmentMode ? 'מצב כהה' : 'מצב קלף'}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{parchmentMode ? '🌙' : '📜'}</span>
            </button>
            <button onClick={() => setShowSettings(!showSettings)}
              className="cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 hover:brightness-125 flex items-center justify-center"
              style={{ width: '70px', height: '70px' }}>
              <img src="/icon-settings.png" alt="הגדרות" style={{ width: '70px', height: '70px', objectFit: 'contain', pointerEvents: 'none', transform: 'scale(4)', transformOrigin: 'center' }} />
            </button>
            <button onClick={() => setShowTopBar(false)}
              className="mr-3 text-white/20 hover:text-white/50 cursor-pointer text-xs transition-colors">
              ▲
            </button>
          </div>
          )}
        </div>

      ) : (
      /* ======== TOP BAR COLLAPSED — Show button (▼) (shared mobile+desktop) ======== */
        <button
          onClick={() => setShowTopBar(true)}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-40 w-8 h-5 rounded-b-lg flex items-center justify-center
                     text-white/20 hover:text-white/50 cursor-pointer text-xs transition-colors border border-white/10 border-t-0"
          style={{ backgroundColor: '#0a0e1a' }}
        >
          ▼
        </button>
      )}

    {/* ======== MAIN CONTENT AREA (parchment or dark background) ======== */}
    <div
      className={`min-h-screen page-enter ${parchmentMode ? 'reader-parchment' : 'reader-dark'}`}
      style={parchmentMode && mirroredBg ? { backgroundImage: `url(${mirroredBg})` } : {}}
    >
      <style>{`
        .reader-parchment {
          background-color: #d4c4a0;
          background-size: 100% auto;
          background-repeat: repeat-y;
          background-position: top center;
          position: relative;
        }
        .reader-dark {
          background-color: #0a0e1a;
          position: relative;
        }
        .reader-dark::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(to bottom, #0a0e1a, transparent);
          z-index: 45;
          pointer-events: none;
        }
        .reader-dark::after {
          content: '';
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(to top, #0a0e1a, transparent);
          z-index: 45;
          pointer-events: none;
        }
      `}</style>
      {/* Mirrored background is applied inline via mirroredBg state */}

      {/* Spacer for fixed top bar */}
      {showTopBar && <div className={isMobile ? "h-[72px]" : "h-16"} />}

      {showSettings && (
        <SettingsPanel settings={settings} onUpdate={updateSettings} onClose={() => setShowSettings(false)}
          onAdjustBorders={() => setAdjustingBorders(true)} />
      )}

      {/* ======== MODE 1: Verse-by-verse (each verse is a block) ======== */}
      {viewMode === 1 && (
        <div className="py-8 pb-32" style={{ paddingLeft: `${textPadding}px`, paddingRight: `${textPadding}px` }} dir="rtl">
          {verses.map((verse, vIndex) => (
            <div key={verse.number} ref={(el) => (verseRefs.current[vIndex] = el)}>
              {(() => {
                const isActiveVerse = vIndex === currentVerse || (audio.isPlaying && audio.hasSync && vIndex === audio.activeVerse);
                const opacityClass = isActiveVerse ? 'opacity-100' : focusMode ? 'opacity-50' : settings.showAllText ? 'opacity-100' : 'opacity-30';
                return (
              <div
                className={`torah-text cursor-pointer transition-all duration-500 origin-center ${opacityClass}`}
                style={{ ...getVerseStyle(vIndex, showSavedTranslations ? fontSize * 0.5 : fontSize), color: parchmentMode ? '#000000' : '#e8e0d0', fontFamily: parchmentMode ? "'ShmulikCLM', serif" : "var(--font-torah)", transition: 'font-size 0.4s ease', ...(settings.showAllText && (!focusMode || isActiveVerse) ? { textShadow: getVerseGlow(vIndex) } : {}) }}
                onClick={() => { setCurrentVerse(vIndex); setCurrentWord(0); }}
              >
                {parchmentMode ? (
                  <bdi className="select-none" style={{ fontSize: showSavedTranslations ? (settings.hebrewNumerals ? (isMobile ? '7px' : '10px') : (isMobile ? '10px' : '14px')) : (settings.hebrewNumerals ? (isMobile ? '13px' : '20px') : (isMobile ? '19px' : '28px')), fontFamily: settings.hebrewNumerals ? "'TrashimCLM', serif" : "'Combinumerals', serif", color: '#2b1a0a', marginLeft: '8px', lineHeight: '1', verticalAlign: 'middle', direction: 'ltr', display: 'inline-block', transform: isMobile ? 'translateY(5px)' : 'none', transition: 'font-size 0.4s ease' }}>{settings.hebrewNumerals ? toHebrewNumeral(verse.number) : toCombiNumerals(verse.number)}</bdi>
                ) : (
                  <span className="ml-3 font-ui select-none" style={{ fontSize: '16px', fontFamily: "'Georgia', 'Times New Roman', serif", color: 'rgba(212, 168, 67, 0.7)', textShadow: '0 0 6px rgba(212, 168, 67, 0.4)' }}>{hn(verse.number)}</span>
                )}
                {verse.words.map((word, wIndex) => (
                  <span
                    key={wIndex}
                    className={`inline transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 ${getWordClass(vIndex, wIndex)} ${syncEditMode ? 'cursor-pointer hover:!text-yellow-300' : (audio.hasSync ? 'cursor-pointer' : '')}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (syncEditMode) handleSyncEditClick(vIndex, wIndex);
                      else if (audio.hasSync) handleWordSeek(vIndex, wIndex);
                    }}
                  >
                    {word}{' '}
                  </span>
                ))}
              </div>
                );
              })()}
              {/* Interlinear translation (API or saved) */}
              {(() => {
                const apiTrans = showTranslations && verseTranslations[vIndex];
                const savedTrans = showSavedTranslations && savedTranslations && savedTranslations[String(vIndex)];
                const transText = apiTrans || savedTrans;
                if (transText) return (
                  <div
                    className={`mt-1 mb-6 transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 ${editingTranslations ? 'cursor-text' : ''}`}
                    style={{
                      color: parchmentMode ? '#000000' : 'rgba(212, 168, 67, 0.6)',
                      fontSize: `${Math.max(16, fontSize * 0.55 * 1.5)}px`,
                      lineHeight: '1.8',
                      fontFamily: "'Frank Ruhl Libre', serif",
                      textAlign: 'center',
                      paddingRight: '40px',
                      paddingLeft: '40px',
                      outline: editingTranslations ? '1px dashed rgba(212,168,67,0.4)' : 'none',
                      borderRadius: editingTranslations ? '8px' : '0',
                      padding: editingTranslations ? '8px 40px' : undefined,
                    }}
                    dir="rtl"
                    contentEditable={editingTranslations && isAdmin()}
                    suppressContentEditableWarning
                    onBlur={editingTranslations && isAdmin() ? (e) => updateVerseTranslation(vIndex, e.target.innerText.trim()) : undefined}
                  >
                    {transText}
                  </div>
                );
                return <div className="mb-6" />;
              })()}
            </div>
          ))}

        </div>
      )}

      {/* ======== MODE 2: Torah-scroll style (flowing continuous text) ======== */}
      {viewMode === 2 && (
        <div className="py-8 pb-32" style={{ paddingLeft: `${textPadding}px`, paddingRight: `${textPadding}px` }} dir="rtl">
          <div
            className="leading-[2.4] text-right"
            style={{ fontSize: `${fontSize}px`, color: parchmentMode ? '#000000' : '#e8e0d0', fontFamily: parchmentMode ? "'ShmulikCLM', serif" : "var(--font-torah)" }}
          >
            {verses.map((verse, vIndex) => {
              const blur = getVerseBlur(vIndex);
              const isCurrent = vIndex === currentVerse || (audio.isPlaying && audio.hasSync && vIndex === audio.activeVerse);
              const spanStyle = {};
              if (blur > 0) spanStyle.filter = `blur(${blur}px)`;
              // In mode 2, use font-size changes instead of transform to avoid layout glitches
              if (magnifyMode) {
                spanStyle.fontSize = isCurrent ? `${fontSize * 1.3}px` : `${fontSize * 0.9}px`;
              }
              return (
                <span
                  key={verse.number}
                  className={`transition-all duration-500 ${
                    isCurrent ? 'opacity-100' :
                    focusMode ? 'opacity-50' :
                    settings.showAllText ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{ ...spanStyle, ...(settings.showAllText && (!focusMode || isCurrent) ? { textShadow: getVerseGlow(vIndex) } : {}) }}
                >
                  {parchmentMode ? (
                    <bdi className="select-none" style={{ fontSize: settings.hebrewNumerals ? (isMobile ? '13px' : '20px') : (isMobile ? '19px' : '28px'), fontFamily: settings.hebrewNumerals ? "'TrashimCLM', serif" : "'Combinumerals', serif", color: '#2b1a0a', marginLeft: '8px', lineHeight: '1', verticalAlign: 'middle', direction: 'ltr', display: 'inline-block', transform: isMobile ? 'translateY(5px)' : 'none' }}>{settings.hebrewNumerals ? toHebrewNumeral(verse.number) : toCombiNumerals(verse.number)}</bdi>
                  ) : (
                    <span className="font-ui select-none" style={{ fontSize: '16px', fontFamily: "'Georgia', 'Times New Roman', serif", color: 'rgba(212, 168, 67, 0.7)', textShadow: '0 0 6px rgba(212, 168, 67, 0.4)' }}>{hn(verse.number)}</span>
                  )}{' '}
                  {verse.words.map((word, wIndex) => (
                    <span
                      key={wIndex}
                      ref={isCurrentWord(vIndex, wIndex) ? wordRef : null}
                      className={`inline transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 cursor-pointer ${getWordClass(vIndex, wIndex)} ${syncEditMode ? 'hover:!text-yellow-300' : ''}`}
                      onClick={() => {
                        if (syncEditMode) { handleSyncEditClick(vIndex, wIndex); }
                        else if (audio.hasSync) { handleWordSeek(vIndex, wIndex); }
                        else { setCurrentVerse(vIndex); setCurrentWord(wIndex); }
                      }}
                    >
                      {word}{' '}
                    </span>
                  ))}
                </span>
              );
            })}
          </div>

        </div>
      )}

      {/* Spacer for fixed bottom bar */}
      {showBottomBar && <div style={{ height: '80px' }} />}
    </div>

      {/* ======== BORDER ADJUSTMENT OVERLAY (draggable padding handles) ======== */}
      {adjustingBorders && (
        <>
          {/* Overlay hint + done button */}
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[55] flex flex-col items-center gap-2">
            <span className="text-white/50 text-sm font-ui bg-navy/90 px-4 py-1.5 rounded-full border border-white/10">
              גרור את הידיות כדי לשנות שוליים — {textPadding}px
            </span>
            <button
              onClick={() => setAdjustingBorders(false)}
              className="text-gold font-ui text-sm px-5 py-1.5 rounded-full border border-gold/40
                         hover:bg-gold/10 cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200"
              style={{ backgroundColor: '#0a0e1a' }}
            >
              ✓ סיום
            </button>
          </div>

          {/* Right handle */}
          <div
            className="fixed top-0 bottom-0 z-40 flex items-center cursor-col-resize group"
            style={{ right: `${textPadding - 8}px` }}
            onMouseDown={(e) => handleDragStart(e, 'right')}
            onTouchStart={(e) => handleDragStart(e, 'right')}
          >
            {/* Visible line */}
            <div className="w-px h-full opacity-40 group-hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#d4a843' }} />
            {/* Handle grip */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-14 rounded-lg border border-gold/40
                            flex items-center justify-center group-hover:border-gold/70 group-hover:bg-gold/10 transition-all"
              style={{ backgroundColor: '#131830' }}>
              <div className="flex gap-0.5">
                <div className="w-0.5 h-6 rounded-full bg-gold/40 group-hover:bg-gold/70 transition-colors" />
                <div className="w-0.5 h-6 rounded-full bg-gold/40 group-hover:bg-gold/70 transition-colors" />
              </div>
            </div>
          </div>

          {/* Left handle */}
          <div
            className="fixed top-0 bottom-0 z-40 flex items-center cursor-col-resize group"
            style={{ left: `${textPadding - 8}px` }}
            onMouseDown={(e) => handleDragStart(e, 'left')}
            onTouchStart={(e) => handleDragStart(e, 'left')}
          >
            {/* Visible line */}
            <div className="w-px h-full opacity-40 group-hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#d4a843' }} />
            {/* Handle grip */}
            <div className="absolute top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-14 rounded-lg border border-gold/40
                            flex items-center justify-center group-hover:border-gold/70 group-hover:bg-gold/10 transition-all"
              style={{ backgroundColor: '#131830' }}>
              <div className="flex gap-0.5">
                <div className="w-0.5 h-6 rounded-full bg-gold/40 group-hover:bg-gold/70 transition-colors" />
                <div className="w-0.5 h-6 rounded-full bg-gold/40 group-hover:bg-gold/70 transition-colors" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======== SYNC EDIT TOOLBAR ======== */}
      {syncEditMode && (
        <div className="fixed bottom-20 left-0 right-0 z-50 flex items-center justify-center gap-4 py-2 px-4"
          style={{ backgroundColor: 'rgba(40, 20, 10, 0.95)', borderTop: '1px solid rgba(212,168,67,0.4)' }}
          dir="rtl"
        >
          <span className="text-gold font-ui text-sm">עריכת סנכרון</span>
          <span className="text-white/50 font-ui text-xs">לחץ על מילה כדי לסנכרן אותה לזמן הנוכחי באודיו</span>
          <span className="text-white/40 font-ui text-xs">{formatTime(audio.currentTime)}</span>
          {syncEditsCount > 0 && (
            <span className="text-yellow-400 font-ui text-xs">{syncEditsCount} שינויים</span>
          )}
          {syncEditsCount > 0 && (
            <button
              onClick={saveSyncEdits}
              className="px-3 py-1 rounded-lg border border-gold/50 text-gold text-sm font-ui cursor-pointer hover:bg-gold/10 transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200"
            >
              שמור
            </button>
          )}
          {syncSaveStatus && (
            <span className="text-green-400 font-ui text-xs">{syncSaveStatus}</span>
          )}
          <button
            onClick={() => { setSyncEditMode(false); setSyncEditsCount(0); setSyncSaveStatus(''); }}
            className="px-3 py-1 rounded-lg border border-white/20 text-white/50 text-sm font-ui cursor-pointer hover:bg-white/5 transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200"
          >
            סגור
          </button>
        </div>
      )}

      {/* ======== BOTTOM BAR (fixed, z-50) — audio + navigation ======== */}
      {showBottomBar ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5" style={{ backgroundColor: '#0a0e1a' }}>
          {/* ROW 1: Audio timeline */}
          {(
            <div className="flex items-center gap-3 px-6 pt-2 pb-1">
              <span className="text-white/30 text-[10px] font-ui w-10 text-center">
                {formatTime(audio.currentTime)}
              </span>
              <div
                ref={audioSliderRef}
                className="flex-1 relative h-5 flex items-center cursor-pointer group"
                onMouseDown={(e) => {
                  setIsDraggingAudio(true);
                  const rect = audioSliderRef.current.getBoundingClientRect();
                  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  audio.seekPercent(percent);
                }}
                onMouseMove={(e) => {
                  if (isDraggingAudio && audioSliderRef.current) {
                    const rect = audioSliderRef.current.getBoundingClientRect();
                    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    audio.seekPercent(percent);
                  }
                }}
                onMouseUp={() => setIsDraggingAudio(false)}
                onMouseLeave={() => setIsDraggingAudio(false)}
                onTouchStart={(e) => {
                  setIsDraggingAudio(true);
                  const rect = audioSliderRef.current.getBoundingClientRect();
                  const percent = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                  audio.seekPercent(percent);
                }}
                onTouchMove={(e) => {
                  if (isDraggingAudio && audioSliderRef.current) {
                    const rect = audioSliderRef.current.getBoundingClientRect();
                    const percent = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                    audio.seekPercent(percent);
                  }
                }}
                onTouchEnd={() => setIsDraggingAudio(false)}
              >
                {/* Track background */}
                <div className="absolute inset-x-0 h-1 bg-white/10 rounded-full" />
                {/* Track fill */}
                <div
                  className="absolute h-1 bg-gold/50 rounded-full"
                  style={{ width: `${audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0}%` }}
                />
                {/* Thumb */}
                <div
                  className="absolute w-3 h-3 bg-gold rounded-full shadow-[0_0_6px_rgba(212,168,67,0.4)] transition-transform group-hover:scale-125"
                  style={{ left: `calc(${audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0}% - 6px)` }}
                />
              </div>
              <span className="text-white/30 text-[10px] font-ui w-10 text-center">
                {formatTime(audio.duration)}
              </span>
            </div>
          )}

          {/* ROW 2: Controls */}
          <div className="h-12 flex items-center justify-center gap-3 relative">
            <button onClick={() => setShowBottomBar(false)}
              className="absolute left-4 text-white/20 hover:text-white/50 cursor-pointer text-xs transition-colors">
              ▼
            </button>

            {chapter < book.chapters && (
              <span className="text-white/25 text-xs font-ui">פרק {hn(chapter + 1)}</span>
            )}
            <button
              onClick={goToNextChapter}
              disabled={chapter >= book.chapters}
              className={`w-9 h-9 rounded-full border flex items-center justify-center text-base cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 ${
                chapter < book.chapters
                  ? 'border-white/20 text-white/50 hover:text-gold hover:border-gold/40'
                  : 'border-white/10 text-white/15 cursor-default'
              }`}
            >
              ←
            </button>

            <div className="relative group/vol flex items-center">
              <button
                onClick={audio.hasAudio ? audio.togglePlay : undefined}
                className={`w-10 h-10 rounded-full border flex items-center justify-center
                           transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 cursor-pointer text-base ${
                             audio.hasAudio
                               ? 'border-gold/30 text-gold hover:bg-gold/10'
                               : 'border-white/10 text-white/20'
                           }`}
                title="השמע קריאה"
              >
                {audio.isPlaying ? '⏸' : '🔊'}
              </button>
              {/* Volume slider — slides out on hover */}
              {audio.hasAudio && (
                <div className="absolute left-full ml-1 opacity-0 group-hover/vol:opacity-100 pointer-events-none group-hover/vol:pointer-events-auto transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 flex items-center"
                  style={{ width: '90px' }}
                >
                  <div className="bg-[#131830] border border-white/10 rounded-full px-2 py-1.5 flex items-center gap-1.5 shadow-lg">
                    <span className="text-white/30 text-[9px]">🔈</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      defaultValue="1"
                      onChange={(e) => {
                        if (audio.setVolume) audio.setVolume(parseFloat(e.target.value));
                      }}
                      className="w-12 h-1 accent-[#d4a843] cursor-pointer"
                      style={{ accentColor: '#d4a843' }}
                    />
                    <span className="text-white/30 text-[9px]">🔊</span>
                  </div>
                </div>
              )}
            </div>
            {audio.isPlaying && (
              <button
                onClick={audio.stop}
                className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center
                           text-white/40 transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 cursor-pointer text-sm hover:text-gold hover:border-gold/30"
                title="עצור"
              >
                ⏹
              </button>
            )}

            {isAdmin() && audio.hasAudio && audio.hasSync && !syncEditMode && (
              <button
                onClick={() => setSyncEditMode(true)}
                className="px-2 py-1 rounded-lg border border-white/15 text-white/30 text-[10px] font-ui
                           cursor-pointer hover:text-gold hover:border-gold/30 transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200"
                title="עריכת סנכרון"
              >
                Edit Sync
              </button>
            )}

            <button
              onClick={goToPrevChapter}
              disabled={chapter <= 1}
              className={`w-9 h-9 rounded-full border flex items-center justify-center text-base cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 ${
                chapter > 1
                  ? 'border-white/20 text-white/50 hover:text-gold hover:border-gold/40'
                  : 'border-white/10 text-white/15 cursor-default'
              }`}
            >
              →
            </button>
            {chapter > 1 && (
              <span className="text-white/25 text-xs font-ui">פרק {hn(chapter - 1)}</span>
            )}
          </div>

          {/* Translate button — right side of bottom bar. Admin-only (Claude API costs money). */}
          {isAdmin() && (
            <button
              onClick={handleTranslate}
              className={`absolute left-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg border text-sm font-ui
                         cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 ${
                           translating
                             ? 'border-gold/50 text-gold bg-gold/10'
                             : 'border-white/15 text-white/40 hover:text-gold hover:border-gold/30'
                         }`}
              title="תרגם טקסט מסומן"
            >
              {translating ? '...' : 'תרגום'}
            </button>
          )}

          {/* Show saved translations button */}
          {savedTranslations && (
            <button
              onClick={() => setShowSavedTranslations(prev => !prev)}
              className={`absolute left-24 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg border text-sm font-ui
                         cursor-pointer transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200 ${
                           showSavedTranslations
                             ? 'border-gold/50 text-gold bg-gold/10'
                             : 'border-white/15 text-white/40 hover:text-gold hover:border-gold/30'
                         }`}
              title="הצג/הסתר תרגום שמור"
            >
              {showSavedTranslations ? 'הסתר תרגום' : 'הצג תרגום'}
            </button>
          )}

          {/* Edit translations button — admin-only, only when translations are visible */}
          {isAdmin() && showSavedTranslations && savedTranslations && (
            editingTranslations ? (
              <button
                onClick={saveTranslationEdits}
                className="absolute left-52 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg border border-green-500/50 text-green-400 text-sm font-ui cursor-pointer hover:bg-green-500/10 transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200"
              >
                שמור עריכה
              </button>
            ) : (
              <button
                onClick={() => setEditingTranslations(true)}
                className="absolute left-52 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg border border-white/15 text-white/40 text-sm font-ui cursor-pointer hover:text-gold hover:border-gold/30 transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200"
              >
                ערוך תרגום
              </button>
            )
          )}

          {/* Search bar — physical right side of Row 2, inline with buttons.
              Desktop only; mobile uses the compass button below that opens a full-screen overlay. */}
          {!isMobile && (
          <div
            className="absolute right-4 top-1/2"
            style={{ width: '220px', transform: 'translateY(calc(-50% + 3px))' }}
            dir="rtl"
          >
            <div
              className="relative rounded-full overflow-hidden transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200"
              style={{
                background: 'linear-gradient(180deg, rgba(30,24,12,0.78), rgba(15,12,6,0.85))',
                border: searchFocused
                  ? '1px solid rgba(212,168,67,0.6)'
                  : '1px solid rgba(255,255,255,0.15)',
                boxShadow: searchFocused
                  ? '0 0 14px rgba(212,168,67,0.2)'
                  : 'none',
              }}
            >
              <input
                type="text"
                dir="rtl"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchError(''); }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleBottomSearch()}
                placeholder="חיפוש"
                className="w-full pl-8 pr-3 py-1 bg-transparent text-white/85 text-xs outline-none text-center"
                style={{
                  fontFamily: 'var(--font-title)',
                  caretColor: '#d4a843',
                }}
              />
              <button
                onClick={handleBottomSearch}
                aria-label="חפש"
                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-gold cursor-pointer"
                style={{
                  left: '4px',
                  width: '22px',
                  height: '22px',
                  background: 'transparent',
                  border: 'none',
                  filter: 'drop-shadow(0 0 3px rgba(212,168,67,0.3))',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
            {searchError && (
              <p className="absolute left-0 right-0 -top-5 text-red-400/90 text-[10px] font-ui text-center whitespace-nowrap">
                {searchError}
              </p>
            )}
          </div>
          )}

          {/* Mobile search trigger — compass icon in the bottom-right of Row 2.
              Opens a full-screen overlay so it doesn't fight other buttons for space. */}
          {isMobile && (
            <button
              onClick={() => { setSearchError(''); setSearchOverlayOpen(true); }}
              aria-label="חיפוש / קפיצה לפרק"
              title="חיפוש / קפיצה לפרק"
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center
                         rounded-full border border-gold/30 text-gold hover:bg-gold/10 cursor-pointer
                         transition-[transform,opacity,color,background-color,border-color,box-shadow,filter] duration-200"
              style={{ width: '34px', height: '34px' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </button>
          )}
        </div>
      ) : (
      /* ======== BOTTOM BAR COLLAPSED — Show button (▲) ======== */
        <button
          onClick={() => setShowBottomBar(true)}
          className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 w-8 h-5 rounded-t-lg flex items-center justify-center
                     text-white/20 hover:text-white/50 cursor-pointer text-xs transition-colors border border-white/10 border-b-0"
          style={{ backgroundColor: '#0a0e1a' }}
        >
          ▲
        </button>
      )}

      {/* ======== MOBILE SEARCH OVERLAY ======== */}
      {searchOverlayOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center"
          style={{
            backgroundColor: 'rgba(5,8,16,0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            paddingTop: '22vh',
          }}
          onClick={() => setSearchOverlayOpen(false)}
        >
          <div
            className="w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Close button */}
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setSearchOverlayOpen(false)}
                aria-label="סגור"
                className="rounded-full flex items-center justify-center text-white/50 hover:text-white cursor-pointer transition-all duration-200"
                style={{ width: '34px', height: '34px', backgroundColor: 'rgba(255,255,255,0.06)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </svg>
              </button>
            </div>

            {/* Search field */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(30,36,60,0.95) 0%, rgba(18,22,40,0.98) 100%)',
                border: '1px solid rgba(212,168,67,0.35)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 40px rgba(212,168,67,0.12)',
              }}
            >
              <input
                type="text"
                dir="rtl"
                autoFocus
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchError(''); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { handleBottomSearch(); setSearchOverlayOpen(false); }
                  if (e.key === 'Escape') setSearchOverlayOpen(false);
                }}
                placeholder="קפוץ לפרק  —  לדוגמה: בראשית ג"
                className="w-full bg-transparent text-white/90 outline-none text-center"
                style={{
                  fontFamily: 'var(--font-title)',
                  caretColor: '#d4a843',
                  fontSize: '17px',
                  padding: '18px 20px',
                }}
              />
            </div>

            {/* Error + hint */}
            {searchError ? (
              <p className="text-red-400/90 text-xs font-ui text-center mt-3">{searchError}</p>
            ) : (
              <p className="text-white/35 text-[11px] font-ui text-center mt-3">
                הקלד שם ספר ומספר פרק, ולחץ Enter
              </p>
            )}
          </div>
        </div>
      )}

    </>
  );
}
