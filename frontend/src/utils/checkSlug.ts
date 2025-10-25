/**
 * Frontend-based slug validation
 * Checks slug format and basic availability rules
 */
export const checkSlug = (slug: string) => {
  // Basic validation rules
  const minLength = 3;
  const maxLength = 50;
  const validPattern = /^[a-z0-9-]+$/;

  // Check if slug is empty
  if (!slug || slug.trim().length === 0) {
    return {
      available: false,
      message: "Slug is required",
      valid: false,
    };
  }

  // Check minimum length
  if (slug.length < minLength) {
    return {
      available: false,
      message: `Slug must be at least ${minLength} characters long`,
      valid: false,
    };
  }

  // Check maximum length
  if (slug.length > maxLength) {
    return {
      available: false,
      message: `Slug must be no more than ${maxLength} characters long`,
      valid: false,
    };
  }

  // Check for valid characters (lowercase letters, numbers, hyphens only)
  if (!validPattern.test(slug)) {
    return {
      available: false,
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
      valid: false,
    };
  }

  // Check for consecutive hyphens
  if (slug.includes("--")) {
    return {
      available: false,
      message: "Slug cannot contain consecutive hyphens",
      valid: false,
    };
  }

  // Check if starts or ends with hyphen
  if (slug.startsWith("-") || slug.endsWith("-")) {
    return {
      available: false,
      message: "Slug cannot start or end with a hyphen",
      valid: false,
    };
  }

  // Check for reserved words (common words that might conflict with routes)
  const reservedWords = [
    "admin",
    "api",
    "auth",
    "login",
    "register",
    "dashboard",
    "profile",
    "settings",
    "courses",
    "lessons",
    "modules",
    "content",
    "users",
    "help",
    "support",
    "about",
    "contact",
    "privacy",
    "terms",
    "blog",
    "news",
    "featured",
    "popular",
    "new",
    "trending",
    "categories",
    "search",
    "filter",
  ];

  if (reservedWords.includes(slug.toLowerCase())) {
    return {
      available: false,
      message: "This slug is reserved and cannot be used",
      valid: false,
    };
  }

  // If all checks pass, slug is valid
  return {
    available: true,
    message: "Slug is available",
    valid: true,
  };
};

/**
 * Generate a slug from a title
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
};

/**
 * Suggest alternative slugs if the current one is not available
 */
export const suggestSlugs = (baseSlug: string, count: number = 3): string[] => {
  const suggestions: string[] = [];

  for (let i = 1; i <= count; i++) {
    const suggestion = `${baseSlug}-${i}`;
    const check = checkSlug(suggestion);
    if (check.available) {
      suggestions.push(suggestion);
    }
  }

  // If we don't have enough suggestions, try with timestamp
  if (suggestions.length < count) {
    const timestamp = Date.now().toString().slice(-4);
    const timestampSuggestion = `${baseSlug}-${timestamp}`;
    const check = checkSlug(timestampSuggestion);
    if (check.available) {
      suggestions.push(timestampSuggestion);
    }
  }

  return suggestions;
};
