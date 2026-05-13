// Aksara Bali codepoint registry — mirror dari lib/aksara-codepoints.js (web).
// Disalin manual karena mobile/ punya tsconfig terpisah dan tidak import dari parent.
// Sumber codepoint: standar Unicode Balinese block (U+1B00..U+1B7F).
// Ref: https://www.unicode.org/charts/PDF/U1B00.pdf
// Rendering visual via Noto Sans Balinese (bundled di mobile/).

export const CP = {
  // Aksara Wianjana — 18 konsonan dasar (anacaraka).
  ha: 0x1b33,
  na: 0x1b26,
  ca: 0x1b18,
  ra: 0x1b2d,
  ka: 0x1b13,
  da: 0x1b24,
  ta: 0x1b22,
  sa: 0x1b32,
  wa: 0x1b2f,
  la: 0x1b2e,
  ma: 0x1b2b,
  ga: 0x1b15,
  ba: 0x1b29,
  nga: 0x1b17,
  pa: 0x1b27,
  ja: 0x1b1a,
  ya: 0x1b2c,
  nya: 0x1b1c,

  // Aksara Swara — vokal mandiri.
  akara: 0x1b05,
  akaraTedung: 0x1b06,
  ikara: 0x1b07,
  ikaraTedung: 0x1b08,
  ukara: 0x1b09,
  ukaraTedung: 0x1b0a,
  raRepa: 0x1b0b,
  raRepaTedung: 0x1b0c,
  laLenga: 0x1b0d,
  laLengaTedung: 0x1b0e,
  ekara: 0x1b0f,
  aiKara: 0x1b10,
  okara: 0x1b11,
  okaraTedung: 0x1b12,

  // Pangangge Suara — sandangan vokal.
  tedung: 0x1b35,
  ulu: 0x1b36,
  suku: 0x1b38,
  taleng: 0x1b3e,
  talingTedung: 0x1b40,
  pepet: 0x1b42,

  // Angka (digit 0–9).
  digit0: 0x1b50,
  digit1: 0x1b51,
  digit2: 0x1b52,
  digit3: 0x1b53,
  digit4: 0x1b54,
  digit5: 0x1b55,
  digit6: 0x1b56,
  digit7: 0x1b57,
  digit8: 0x1b58,
  digit9: 0x1b59,

  // Generic.
  dottedCircle: 0x25cc
} as const;

export const glyph = (...codepoints: number[]): string =>
  codepoints.map((cp) => String.fromCodePoint(cp)).join("");

export const pangangge = (cp: number): string => glyph(CP.dottedCircle, cp);
