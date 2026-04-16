import { useState, useCallback } from 'react';

const BASE_URL = 'https://www.sefaria.org/api/v3/texts/';

export function useSefaria() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchChapter = useCallback(async (bookEnglish, chapter) => {
    setLoading(true);
    setError(null);
    try {
      const ref = `${bookEnglish}.${chapter}`;
      const response = await fetch(`${BASE_URL}${ref}?version=source`);
      if (!response.ok) throw new Error('Failed to fetch text');
      const data = await response.json();

      // Extract Hebrew text - v3 API returns versions array
      let hebrewTexts = [];
      if (data.versions && data.versions.length > 0) {
        const hebrewVersion = data.versions.find(v => v.language === 'he') || data.versions[0];
        hebrewTexts = hebrewVersion.text || [];
      }

      // Clean HTML tags and decode entities using DOM parser
      const parser = new DOMParser();
      const cleanText = (html) => {
        const doc = parser.parseFromString(html, 'text/html');
        return doc.body.textContent.trim();
      };

      const verses = hebrewTexts.map((text, i) => {
        const clean = cleanText(text);
        return {
          number: i + 1,
          text: clean,
          words: clean.split(/\s+/).filter(w => w.length > 0),
        };
      });

      setLoading(false);
      return verses;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, []);

  return { fetchChapter, loading, error };
}
