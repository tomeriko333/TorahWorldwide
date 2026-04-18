import { parseHebrewNumeral } from './hebrewNumerals';

const parseNum = (s) => {
  if (!s) return NaN;
  const n = parseInt(s, 10);
  if (!isNaN(n)) return n;
  return parseHebrewNumeral(s);
};

export function parseSearchRef(rawQuery, books) {
  let query = (rawQuery || '').trim();
  if (!query) return { error: '' };

  query = query.replace(/[׳']/g, '');
  query = query.replace(/[״"]/g, '');
  query = query.replace(/(^|\s)(פרק|פסוק|chapter|verse|ch\.?|v\.?)(\s|$)/gi, ' ');
  query = query.trim();
  query = query.replace(/([a-zA-Z\u0590-\u05FF])(\d)/g, '$1 $2');
  query = query.replace(/(\d)([a-zA-Z\u0590-\u05FF])/g, '$1 $2');

  const queryLower = query.toLowerCase();

  const bookNames = (() => {
    const names = [];
    for (const b of books) {
      names.push({ name: b.hebrew, book: b });
      names.push({ name: b.english.toLowerCase(), book: b });
    }
    names.sort((a, b) => b.name.length - a.name.length);
    return names;
  })();

  let foundBook = null;
  let remainder = '';

  for (const { name, book } of bookNames) {
    if (queryLower.startsWith(name)) {
      const afterMatch = queryLower.slice(name.length);
      if (afterMatch === '' || /^[\s:.,;/]/.test(afterMatch)) {
        foundBook = book;
        remainder = query.slice(name.length).trim();
        break;
      }
    }
  }

  if (!foundBook) {
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
        const sorted = [...matches].sort((a, b) => a.hebrew.length - b.hebrew.length);
        if (sorted[0].hebrew.length < sorted[1].hebrew.length) {
          foundBook = sorted[0];
          remainder = query.slice(textMatch[1].length).trim();
        } else {
          const options = matches.map(b => b.hebrew).join(', ');
          return { error: `"${prefix}" מתאים לכמה ספרים: ${options}` };
        }
      }
    }
  }

  if (!foundBook) {
    return { error: 'לא נמצא ספר (לדוגמה: בראשית טו)' };
  }

  if (!remainder) {
    return { error: 'הכנס מספר פרק (לדוגמה: בראשית טו)' };
  }

  const numParts = remainder.split(/[\s:.,;/]+/).filter(Boolean);
  if (numParts.length === 0) {
    return { error: 'הכנס מספר פרק (לדוגמה: בראשית טו)' };
  }

  const chapterNum = parseNum(numParts[0]);

  let verseNum = null;
  if (numParts.length >= 2) {
    const versePart = numParts[1];
    const dashIdx = versePart.indexOf('-');
    if (dashIdx > 0) {
      verseNum = parseNum(versePart.slice(0, dashIdx));
    } else {
      verseNum = parseNum(versePart);
    }
  }

  if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > foundBook.chapters) {
    return { error: `פרק ${numParts[0]} לא קיים ב${foundBook.hebrew} (1-${foundBook.chapters})` };
  }

  return { book: foundBook, chapter: chapterNum, verse: verseNum };
}
