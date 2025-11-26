/**
 * Escapes special regex characters in a string
 * @param str - The string to escape
 * @returns The escaped string
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Creates a fuzzy search pattern from a search query
 * This function splits the query into words and creates regex patterns
 * that allow for partial matches and word order flexibility
 * 
 * @param searchQuery - The search query string
 * @returns A regex pattern string for fuzzy matching
 * 
 * @example
 * // Input: "python course"
 * // Output: ".*python.*|.*course.*" - matches either word anywhere in the text
 */
export const createFuzzySearchPattern = (searchQuery: string): string => {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return "";
  }

  // Trim and normalize whitespace
  const normalizedQuery = searchQuery.trim().replace(/\s+/g, " ");
  
  // Split into words
  const words = normalizedQuery.split(" ").filter(word => word.length > 0);
  
  if (words.length === 0) {
    return "";
  }

  // For each word, create a pattern that matches it anywhere in the text
  // This allows for partial matches and flexible word order
  const patterns = words.map(word => {
    // Escape special characters
    const escapedWord = escapeRegex(word);
    // Match the word anywhere in the text (allows for partial matches)
    return `.*${escapedWord}.*`;
  });

  // Combine patterns with OR - matches if any word is found
  // This makes the search more flexible
  return patterns.join("|");
};

/**
 * Creates MongoDB regex filters for fuzzy search
 * This function generates regex patterns for multiple fields
 * 
 * @param searchQuery - The search query string
 * @param fields - Array of field names to search in
 * @returns Array of MongoDB regex filter objects
 */
export const createFuzzySearchFilters = (
  searchQuery: string,
  fields: string[]
): any[] => {
  if (!searchQuery || searchQuery.trim().length === 0 || fields.length === 0) {
    return [];
  }

  // Trim and normalize whitespace
  const normalizedQuery = searchQuery.trim().replace(/\s+/g, " ");
  
  // Split into words
  const words = normalizedQuery.split(" ").filter(word => word.length > 0);
  
  if (words.length === 0) {
    return [];
  }

  // Create filters for each field
  // Each field should match all words (in any order)
  const filters: any[] = [];
  
  fields.forEach(field => {
    // For each word, create a regex that matches it
    const wordFilters = words.map(word => {
      const escapedWord = escapeRegex(word);
      return {
        [field]: {
          $regex: escapedWord,
          $options: "i", // Case insensitive
        },
      };
    });
    
    // Add all word filters for this field
    filters.push(...wordFilters);
  });

  return filters;
};

/**
 * Creates a MongoDB $or filter for fuzzy search across multiple fields
 * This is the main function to use for fuzzy search in MongoDB queries
 * 
 * The search will match documents where any of the words appear in any of the fields.
 * This provides a flexible, fuzzy search experience.
 * 
 * @param searchQuery - The search query string
 * @param fields - Array of field names to search in
 * @returns MongoDB $or filter object or null if no search query
 * 
 * @example
 * // Input: "python course", ["title", "description"]
 * // Output: {
 * //   $or: [
 * //     { title: { $regex: "python", $options: "i" } },
 * //     { title: { $regex: "course", $options: "i" } },
 * //     { description: { $regex: "python", $options: "i" } },
 * //     { description: { $regex: "course", $options: "i" } }
 * //   ]
 * // }
 * // This will match documents where "python" OR "course" appears in title OR description
 */
export const createFuzzySearchOrFilter = (
  searchQuery: string,
  fields: string[]
): { $or?: any[] } | null => {
  if (!searchQuery || searchQuery.trim().length === 0 || fields.length === 0) {
    return null;
  }

  const filters = createFuzzySearchFilters(searchQuery, fields);
  
  if (filters.length === 0) {
    return null;
  }

  return { $or: filters };
};

