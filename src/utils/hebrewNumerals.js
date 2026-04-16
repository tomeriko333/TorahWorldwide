const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];

const onesMap = { 'א':1,'ב':2,'ג':3,'ד':4,'ה':5,'ו':6,'ז':7,'ח':8,'ט':9 };
const tensMap = { 'י':10,'כ':20,'ל':30,'מ':40,'נ':50,'ס':60,'ע':70,'פ':80,'צ':90 };
const hundredsMap = { 'ק':100,'ר':200,'ש':300,'ת':400 };

export function parseHebrewNumeral(str) {
  if (!str) return NaN;
  // Strip geresh/gershayim
  const clean = str.replace(/[׳״"']/g, '');
  let total = 0;
  for (const ch of clean) {
    if (hundredsMap[ch]) total += hundredsMap[ch];
    else if (tensMap[ch]) total += tensMap[ch];
    else if (onesMap[ch]) total += onesMap[ch];
    else return NaN;
  }
  return total || NaN;
}

export function toHebrewNumeral(n) {
  if (n <= 0 || n > 499) return String(n);

  let h = hundreds[Math.floor(n / 100)];
  let t = tens[Math.floor((n % 100) / 10)];
  let o = ones[n % 10];

  // Special cases: 15 = ט״ו, 16 = ט״ז (avoid יה/יו which spell God's name)
  if (Math.floor((n % 100) / 10) === 1 && n % 10 === 5) { t = 'ט'; o = 'ו'; }
  if (Math.floor((n % 100) / 10) === 1 && n % 10 === 6) { t = 'ט'; o = 'ז'; }

  const result = h + t + o;

  // Add geresh (׳) for single letter, gershayim (״) before last letter for multi
  if (result.length === 1) return result + '׳';
  return result.slice(0, -1) + '״' + result.slice(-1);
}
