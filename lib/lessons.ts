// Mobile lesson data — aksara di-construct dari codepoint via shared helper
// di lib/aksara-codepoints. TIDAK ada character literal aksara di file ini.

import { CP, glyph as fromCp } from "./aksara-codepoints";

export type Glyph = {
  char: string;
  latin: string;
};

export type Lesson = {
  id: string;
  title: string;
  group: "Wrehasta" | "Swara" | "Angka";
  glyphs: Glyph[];
};

const wrehastaSequence: Glyph[] = [
  { char: fromCp(CP.ha),  latin: "Ha" },
  { char: fromCp(CP.na),  latin: "Na" },
  { char: fromCp(CP.ca),  latin: "Ca" },
  { char: fromCp(CP.ra),  latin: "Ra" },
  { char: fromCp(CP.ka),  latin: "Ka" },
  { char: fromCp(CP.da),  latin: "Da" },
  { char: fromCp(CP.ta),  latin: "Ta" },
  { char: fromCp(CP.sa),  latin: "Sa" },
  { char: fromCp(CP.wa),  latin: "Wa" },
  { char: fromCp(CP.la),  latin: "La" },
  { char: fromCp(CP.ma),  latin: "Ma" },
  { char: fromCp(CP.ga),  latin: "Ga" },
  { char: fromCp(CP.ba),  latin: "Ba" },
  { char: fromCp(CP.nga), latin: "Nga" },
  { char: fromCp(CP.pa),  latin: "Pa" },
  { char: fromCp(CP.ja),  latin: "Ja" },
  { char: fromCp(CP.ya),  latin: "Ya" },
  { char: fromCp(CP.nya), latin: "Nya" }
];

const swaraSequence: Glyph[] = [
  { char: fromCp(CP.akara),         latin: "A" },
  { char: fromCp(CP.akaraTedung),   latin: "A tedung" },
  { char: fromCp(CP.ikara),         latin: "I" },
  { char: fromCp(CP.ikaraTedung),   latin: "I tedung" },
  { char: fromCp(CP.ukara),         latin: "U" },
  { char: fromCp(CP.ukaraTedung),   latin: "U tedung" },
  { char: fromCp(CP.raRepa),        latin: "Ra repa" },
  { char: fromCp(CP.raRepaTedung),  latin: "Ra repa tedung" },
  { char: fromCp(CP.laLenga),       latin: "La lenga" },
  { char: fromCp(CP.laLengaTedung), latin: "La lenga tedung" },
  { char: fromCp(CP.ekara),         latin: "E" },
  { char: fromCp(CP.aiKara),        latin: "Ai" },
  { char: fromCp(CP.okara),         latin: "O" },
  { char: fromCp(CP.okaraTedung),   latin: "O tedung" }
];

const angkaSequence: Glyph[] = [
  { char: fromCp(CP.digit0), latin: "0" },
  { char: fromCp(CP.digit1), latin: "1" },
  { char: fromCp(CP.digit2), latin: "2" },
  { char: fromCp(CP.digit3), latin: "3" },
  { char: fromCp(CP.digit4), latin: "4" },
  { char: fromCp(CP.digit5), latin: "5" },
  { char: fromCp(CP.digit6), latin: "6" },
  { char: fromCp(CP.digit7), latin: "7" },
  { char: fromCp(CP.digit8), latin: "8" },
  { char: fromCp(CP.digit9), latin: "9" }
];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildLessons(group: Lesson["group"], prefix: string, sequence: Glyph[], chunkSize: number): Lesson[] {
  return chunk(sequence, chunkSize).map((glyphs, index) => ({
    id: `${group.toLowerCase()}-${index + 1}`,
    title: `${prefix} Bag. ${index + 1}`,
    group,
    glyphs
  }));
}

export const lessons: Lesson[] = [
  ...buildLessons("Wrehasta", "Wrehasta", wrehastaSequence, 3),
  ...buildLessons("Swara", "Swara", swaraSequence, 3),
  ...buildLessons("Angka", "Angka", angkaSequence, 3)
];

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

export function glyphCode(char: string): string {
  return char.codePointAt(0)?.toString(16) ?? "";
}

export function getGlyphByCode(
  hex: string
): { glyph: Glyph; group: Lesson["group"] } | undefined {
  const target = hex.toLowerCase();
  for (const lesson of lessons) {
    for (const glyph of lesson.glyphs) {
      if (glyphCode(glyph.char) === target) return { glyph, group: lesson.group };
    }
  }
  return undefined;
}
