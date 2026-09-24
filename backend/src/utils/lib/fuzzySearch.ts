const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchWords = (searchQuery: string): string[] =>
  searchQuery.trim().split(/\s+/).filter(Boolean).slice(0, 8);

// Word-start match: "sas" finds "SAS" but not "classes"; a prefix still matches ("pyth").
const wordStartRegex = (word: string) => `(?:^|\\W)${escapeRegex(word)}`;

/** Every word must appear, each at the start of a word, in at least one of the fields. */
export const createWordSearchFilter = (
  searchQuery: string,
  fields: string[],
): { $and: Record<string, unknown>[] } | null => {
  const words = searchWords(searchQuery ?? "");
  if (words.length === 0 || fields.length === 0) return null;
  return {
    $and: words.map((word) => ({
      $or: fields.map((field) => ({ [field]: { $regex: wordStartRegex(word), $options: "i" } })),
    })),
  };
};

/** Adds `_searchScore`: 3 exact phrase in the title, 2 every word in the title, else 1. */
export const searchRelevanceStage = (searchQuery: string, titleField = "title") => {
  const words = searchWords(searchQuery ?? "");
  const title = { $ifNull: [`$${titleField}`, ""] };
  const inTitle = (regex: string) => ({ $regexMatch: { input: title, regex, options: "i" } });
  return {
    $addFields: {
      _searchScore: {
        $switch: {
          branches: [
            { case: inTitle(escapeRegex(words.join(" "))), then: 3 },
            { case: { $and: words.map((w) => inTitle(wordStartRegex(w))) }, then: 2 },
          ],
          default: 1,
        },
      },
    },
  };
};
