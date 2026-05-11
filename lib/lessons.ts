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
  { char: "ᬳ", latin: "Ha" },
  { char: "ᬦ", latin: "Na" },
  { char: "ᬘ", latin: "Ca" },
  { char: "ᬭ", latin: "Ra" },
  { char: "ᬓ", latin: "Ka" },
  { char: "ᬤ", latin: "Da" },
  { char: "ᬢ", latin: "Ta" },
  { char: "ᬲ", latin: "Sa" },
  { char: "ᬯ", latin: "Wa" },
  { char: "ᬮ", latin: "La" },
  { char: "ᬫ", latin: "Ma" },
  { char: "ᬕ", latin: "Ga" },
  { char: "ᬩ", latin: "Ba" },
  { char: "ᬗ", latin: "Nga" },
  { char: "ᬧ", latin: "Pa" },
  { char: "ᬚ", latin: "Ja" },
  { char: "ᬬ", latin: "Ya" },
  { char: "ᬜ", latin: "Nya" }
];

const swaraSequence: Glyph[] = [
  { char: "ᬅ", latin: "A" },
  { char: "ᬆ", latin: "A tedung" },
  { char: "ᬇ", latin: "I" },
  { char: "ᬈ", latin: "I tedung" },
  { char: "ᬉ", latin: "U" },
  { char: "ᬊ", latin: "U tedung" },
  { char: "ᬋ", latin: "Ra repa" },
  { char: "ᬌ", latin: "Ra repa tedung" },
  { char: "ᬍ", latin: "La lenga" },
  { char: "ᬎ", latin: "La lenga tedung" },
  { char: "ᬏ", latin: "E" },
  { char: "ᬐ", latin: "Ai" },
  { char: "ᬑ", latin: "O" },
  { char: "ᬒ", latin: "O tedung" }
];

const angkaSequence: Glyph[] = [
  { char: "᭐", latin: "0" },
  { char: "᭑", latin: "1" },
  { char: "᭒", latin: "2" },
  { char: "᭓", latin: "3" },
  { char: "᭔", latin: "4" },
  { char: "᭕", latin: "5" },
  { char: "᭖", latin: "6" },
  { char: "᭗", latin: "7" },
  { char: "᭘", latin: "8" },
  { char: "᭙", latin: "9" }
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
