/**
 * SEO Auto-Generation Utility
 * Generates optimized meta titles and descriptions for courses
 */

import { Course } from "@/types";

// ===================
// Meta Title Generation
// ===================

/**
 * Generate SEO-optimized meta title for a course
 * Format: "{course_name} | Airkrit"
 * Max length: 60 characters (Google's recommended limit)
 */
export const generateMetaTitle = (course: Course): string => {
  const { title } = course;
  
  if (!title) return "";

  // Base format: "{course_name} | Airkrit"
  let metaTitle = `${title} | Airkrit`;
  
  // If the title is too long, truncate it to fit within 60 characters
  if (metaTitle.length > 60) {
    // Reserve 9 characters for " | Airkrit"
    const maxTitleLength = 60 - 9;
    const truncatedTitle = title.substring(0, maxTitleLength).trim();
    
    // Remove trailing incomplete words
    const lastSpaceIndex = truncatedTitle.lastIndexOf(' ');
    const finalTitle = lastSpaceIndex > 0 ? truncatedTitle.substring(0, lastSpaceIndex) : truncatedTitle;
    
    metaTitle = `${finalTitle} | Airkrit`;
  }
  
  return metaTitle;
};

// ===================
// Meta Description Generation
// ===================

/**
 * Generate SEO-optimized meta description for a course
 * Max length: 160 characters (Google's recommended limit)
 */
export const generateMetaDescription = (course: Course): string => {
  const { 
    title, 
    shortDescription, 
    description, 
    whatYouWillLearn, 
    skills, 
    category, 
    skillLevel,
    duration,
    audience 
  } = course;
  
  if (!title) return "";
  
  // Start with short description if available, otherwise use description
  let metaDesc = shortDescription || description || "";
  
  // If no description available, build from other fields
  if (!metaDesc) {
    const skillsText = skills?.slice(0, 3).join(", ") || "";
    const learningText = whatYouWillLearn ? whatYouWillLearn.substring(0, 80) : "";
    
    if (skillsText) {
      metaDesc = `Learn ${skillsText}`;
      if (category) metaDesc += ` in this ${category.toLowerCase()} course`;
      metaDesc += ".";
    } else if (learningText) {
      metaDesc = learningText;
    } else {
      metaDesc = `Comprehensive ${category || 'professional'} course`;
    }
  }
  
  // Clean up the description
  metaDesc = metaDesc.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  
  // Add compelling elements if space permits
  const additions: string[] = [];
  
  // Add skill level
  if (skillLevel && skillLevel.toLowerCase() !== "intermediate") {
    additions.push(`${skillLevel.toLowerCase()} level`);
  }
  
  // Add duration
  if (duration) {
    additions.push(`${duration} course`);
  }
  
  // Add audience context
  if (audience === "college-students") {
    additions.push("perfect for students");
  } else if (audience === "professionals") {
    additions.push("designed for professionals");
  }
  
  // Add call to action
  if (metaDesc.length < 120) {
    additions.push("Start learning today!");
  }
  
  // Append additions if they fit
  for (const addition of additions) {
    const testDesc = metaDesc.endsWith(".") 
      ? `${metaDesc} ${addition.charAt(0).toUpperCase() + addition.slice(1)}.`
      : `${metaDesc}. ${addition.charAt(0).toUpperCase() + addition.slice(1)}.`;
    
    if (testDesc.length <= 160) {
      metaDesc = testDesc;
    } else {
      break;
    }
  }
  
  // Ensure it doesn't exceed 160 characters
  if (metaDesc.length > 160) {
    // Find last complete sentence that fits
    const sentences = metaDesc.split(". ");
    let finalDesc = "";
    
    for (const sentence of sentences) {
      const testDesc = finalDesc ? `${finalDesc}. ${sentence}` : sentence;
      if (testDesc.length <= 157) { // Leave room for "..."
        finalDesc = testDesc;
      } else {
        break;
      }
    }
    
    if (finalDesc) {
      metaDesc = finalDesc.endsWith(".") ? finalDesc : `${finalDesc}.`;
    } else {
      metaDesc = metaDesc.substring(0, 157) + "...";
    }
  }
  
  return metaDesc;
};

// ===================
// SEO Keywords Generation
// ===================

/**
 * Generate SEO keywords for a course
 * Max: 10 keywords for optimal SEO
 */
export const generateSEOKeywords = (course: Course): string[] => {
  const { title, skills, tags, skillLevel, audience } = course;
  
  const keywords = new Set<string>();
  
  // Add title words (meaningful ones)
  if (title) {
    const titleWords = title
      .toLowerCase()
      .split(/[\s\-_]+/)
      .filter(word => word.length > 2 && !['the', 'and', 'for', 'with', 'course'].includes(word));
    titleWords.forEach(word => keywords.add(word));
  }
  
  // Add skills
  if (skills) {
    skills.forEach(skill => {
      keywords.add(skill.toLowerCase());
      keywords.add(`${skill.toLowerCase()} tutorial`);
    });
  }
  
  // Add tags
  if (tags) {
    tags.forEach(tag => keywords.add(tag.toLowerCase()));
  }
  
  // Add skill level modifier
  if (skillLevel) {
    keywords.add(`${skillLevel.toLowerCase()} course`);
  }
  
  // Add audience-specific keywords
  if (audience === "college-students") {
    keywords.add("student course");
    keywords.add("beginner friendly");
  } else if (audience === "professionals") {
    keywords.add("professional development");
    keywords.add("career advancement");
  }
  
  // Add generic but relevant keywords
  keywords.add("online course");
  keywords.add("learn online");
  keywords.add("certification");
  
  // Convert to array and limit to 10 keywords
  return Array.from(keywords).slice(0, 10);
};

// ===================
// Complete SEO Auto-Generation
// ===================

/**
 * Generate all SEO fields at once
 */
export interface GeneratedSEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

export const generateCompleteSEO = (course: Course): GeneratedSEO => {
  return {
    metaTitle: generateMetaTitle(course),
    metaDescription: generateMetaDescription(course),
    keywords: generateSEOKeywords(course)
  };
};

// ===================
// SEO Quality Checker
// ===================

/**
 * Check the quality of SEO fields and provide suggestions
 */
export interface SEOQuality {
  metaTitle: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  metaDescription: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  keywords: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  overallScore: number;
}

export const checkSEOQuality = (course: Course): SEOQuality => {
  const { metaTitle = "", metaDescription = "", keywords = [] } = course;
  
  // Meta Title Analysis
  const titleIssues: string[] = [];
  const titleSuggestions: string[] = [];
  let titleScore = 100;
  
  if (!metaTitle) {
    titleIssues.push("Meta title is missing");
    titleScore -= 50;
  } else {
    if (metaTitle.length < 30) {
      titleIssues.push("Meta title is too short (< 30 characters)");
      titleSuggestions.push("Add more descriptive keywords");
      titleScore -= 20;
    }
    if (metaTitle.length > 60) {
      titleIssues.push("Meta title is too long (> 60 characters)");
      titleSuggestions.push("Shorten title to fit Google's display limit");
      titleScore -= 30;
    }
    if (!metaTitle.includes("Airkrit")) {
      titleIssues.push("Meta title should include 'Airkrit' brand name");
      titleScore -= 15;
    }
    if (!metaTitle.includes(course.title?.split(" ")[0] || "")) {
      titleIssues.push("Meta title should include main course keywords");
      titleScore -= 15;
    }
  }
  
  // Meta Description Analysis
  const descIssues: string[] = [];
  const descSuggestions: string[] = [];
  let descScore = 100;
  
  if (!metaDescription) {
    descIssues.push("Meta description is missing");
    descScore -= 50;
  } else {
    if (metaDescription.length < 120) {
      descIssues.push("Meta description is too short (< 120 characters)");
      descSuggestions.push("Add more compelling details about the course");
      descScore -= 20;
    }
    if (metaDescription.length > 160) {
      descIssues.push("Meta description is too long (> 160 characters)");
      descSuggestions.push("Shorten description to fit Google's display limit");
      descScore -= 30;
    }
    if (!metaDescription.toLowerCase().includes("learn")) {
      descSuggestions.push("Consider adding action words like 'learn', 'master', or 'discover'");
      descScore -= 10;
    }
  }
  
  // Keywords Analysis
  const keywordIssues: string[] = [];
  const keywordSuggestions: string[] = [];
  let keywordScore = 100;
  
  if (keywords.length === 0) {
    keywordIssues.push("No SEO keywords defined");
    keywordScore -= 50;
  } else {
    if (keywords.length < 5) {
      keywordIssues.push("Too few keywords (< 5)");
      keywordSuggestions.push("Add more relevant keywords related to the course topic");
      keywordScore -= 20;
    }
    if (keywords.length > 10) {
      keywordIssues.push("Too many keywords (> 10)");
      keywordSuggestions.push("Focus on the most relevant 5-10 keywords");
      keywordScore -= 15;
    }
    // Perfect score for 5-10 keywords (inclusive)
    if (keywords.length >= 5 && keywords.length <= 10) {
      keywordScore = 100;
    }
  }
  
  const overallScore = Math.round((titleScore + descScore + keywordScore) / 3);
  
  return {
    metaTitle: {
      score: Math.max(0, titleScore),
      issues: titleIssues,
      suggestions: titleSuggestions
    },
    metaDescription: {
      score: Math.max(0, descScore),
      issues: descIssues,
      suggestions: descSuggestions
    },
    keywords: {
      score: Math.max(0, keywordScore),
      issues: keywordIssues,
      suggestions: keywordSuggestions
    },
    overallScore: Math.max(0, overallScore)
  };
};

export default {
  generateMetaTitle,
  generateMetaDescription,
  generateSEOKeywords,
  generateCompleteSEO,
  checkSEOQuality
};
