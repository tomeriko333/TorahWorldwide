import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Audio playback hook for Torah/Tanakh chapter readings.
 *
 * FILE NAMING CONVENTION:
 * Place MP3 files in: torah-reader/public/audio/
 * Name format: {BookEnglish}_{Chapter}.mp3
 *
 * Examples:
 *   Genesis_1.mp3, Genesis_2.mp3, ... Genesis_50.mp3
 *   Exodus_1.mp3, ... Exodus_40.mp3
 *   I Samuel_1.mp3, ... I Samuel_31.mp3
 *   Psalms_1.mp3, ... Psalms_150.mp3
 *   Song of Songs_1.mp3, ... Song of Songs_8.mp3
 *
 * The book name MUST match the "english" field in torahStructure.json exactly.
 * Just drop the files in the folder and they work automatically.
 */

export function useAudio(bookEnglish, chapter) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [syncData, setSyncData] = useState(null); // word-level timestamps
  const [activeVerse, setActiveVerse] = useState(-1);
  const [activeWord, setActiveWord] = useState(-1);
  const animFrameRef = useRef(null);

  // Build the audio file path
  // Audio hosted on Internet Archive (archive.org) - free unlimited bandwidth
  const AUDIO_BASE = 'https://archive.org/download/torah-reader-hebrew-audio-2026';
  const audioPath = `${AUDIO_BASE}/${bookEnglish}_${chapter}.mp3`;
  const syncPath = `${AUDIO_BASE}/${bookEnglish}_${chapter}.sync.json`;

  // Load sync data (word-level timestamps) if available
  useEffect(() => {
    setSyncData(null);
    setActiveVerse(-1);
    setActiveWord(-1);
    fetch(syncPath)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setSyncData(data))
      .catch(() => setSyncData(null));
  }, [syncPath]);

  // Check if audio file exists and load it
  useEffect(() => {
    // Cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoaded(false);
    setHasAudio(false);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const audio = new Audio(audioPath);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
      setHasAudio(true);
    };

    const onError = () => {
      // File doesn't exist — no audio for this chapter
      setHasAudio(false);
      setIsLoaded(false);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);

    // Try to load — will trigger error if file doesn't exist
    audio.preload = 'metadata';
    audio.src = audioPath;

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audio.src = '';
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [audioPath]);

  // Update currentTime and active word via requestAnimationFrame while playing
  useEffect(() => {
    const updateTime = () => {
      if (audioRef.current && isPlaying) {
        const t = audioRef.current.currentTime;
        setCurrentTime(t);

        // Find which word is being spoken right now
        if (syncData) {
          let foundV = -1, foundW = -1;
          // Binary-ish search: sync data is sorted by time
          for (let i = 0; i < syncData.length; i++) {
            if (t >= syncData[i].s && t < syncData[i].e) {
              foundV = syncData[i].v;
              foundW = syncData[i].w;
              break;
            }
            // If we're between words (gap), highlight the previous word
            if (i > 0 && t >= syncData[i - 1].e && t < syncData[i].s) {
              foundV = syncData[i - 1].v;
              foundW = syncData[i - 1].w;
              break;
            }
          }
          setActiveVerse(foundV);
          setActiveWord(foundW);
        }

        animFrameRef.current = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateTime);
    } else {
      setActiveVerse(-1);
      setActiveWord(-1);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, syncData]);

  const play = useCallback(() => {
    if (audioRef.current && hasAudio) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [hasAudio]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current && hasAudio) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [hasAudio]);

  // Seek by percentage (0-1)
  const seekPercent = useCallback((percent) => {
    if (duration > 0) {
      seek(percent * duration);
    }
  }, [duration, seek]);

  // Set volume (0-1)
  const setVolume = useCallback((vol) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, vol));
    }
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    isLoaded,
    hasAudio,
    hasSync: !!syncData,
    syncData,
    setSyncData,
    activeVerse,
    activeWord,
    play,
    pause,
    togglePlay,
    stop,
    seek,
    seekPercent,
    setVolume,
  };
}
