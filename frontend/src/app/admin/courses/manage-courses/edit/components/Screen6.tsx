import Container from "@/app/admin/components/ui/Container";
import React, { useState, useEffect } from "react";
import { useEditCourseContext } from "../../../reducers/course/providers/EditCourseReducerProvider";
import { useEditScreen } from "../contexts/EditScreenContext";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import TagInput from "@/components/ui/inputs/TagInput";
import {
  generateCompleteSEO,
  checkSEOQuality,
  SEOQuality,
} from "@/utils/seoAutoGeneration";
import {
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  Eye,
  Target,
  Zap,
} from "lucide-react";
import ScreenNavigation from "./shared/ScreenNavigation";

// Utility function to generate slug from title
const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
};

// Utility function to validate slug
const validateSlug = (slug: string): { isValid: boolean; message: string } => {
  if (!slug) {
    return { isValid: false, message: "Slug is required" };
  }

  if (slug.length < 3) {
    return {
      isValid: false,
      message: "Slug must be at least 3 characters long",
    };
  }

  if (slug.length > 100) {
    return { isValid: false, message: "Slug must be less than 100 characters" };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      isValid: false,
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    };
  }

  if (slug.startsWith("-") || slug.endsWith("-")) {
    return {
      isValid: false,
      message: "Slug cannot start or end with a hyphen",
    };
  }

  if (slug.includes("--")) {
    return {
      isValid: false,
      message: "Slug cannot contain consecutive hyphens",
    };
  }

  return { isValid: true, message: "" };
};

// FAQ Templates for quick selection
const FAQ_TEMPLATES = {
  "General Course Questions": [
    {
      question: "How long do I have access to the course?",
      answer: "You have lifetime access to the course materials once enrolled.",
    },
    {
      question: "Is there a certificate upon completion?",
      answer:
        "Yes, you will receive a certificate of completion after finishing all course modules.",
    },
    {
      question: "What if I have questions during the course?",
      answer:
        "You can ask questions in the course discussion forum or contact our support team.",
    },
  ],
  "Technical Requirements": [
    {
      question: "What are the technical requirements for this course?",
      answer:
        "You need a computer with internet access and a modern web browser. No special software required.",
    },
    {
      question: "Can I access the course on mobile devices?",
      answer:
        "Yes, the course is fully responsive and works on smartphones and tablets.",
    },
    {
      question: "Do I need any prior experience?",
      answer:
        "This course is designed for beginners. No prior experience is required.",
    },
  ],
  "Support & Refunds": [
    {
      question: "Is there a money-back guarantee?",
      answer:
        "Yes, we offer a 30-day money-back guarantee if you're not satisfied with the course.",
    },
    {
      question: "How can I get help if I'm stuck?",
      answer:
        "You can reach out through the course forum, email support, or schedule a one-on-one session.",
    },
    {
      question: "Can I download the course materials?",
      answer:
        "Yes, most course materials are available for download for offline viewing.",
    },
  ],
};

// FAQ Card Component
const FAQCard = ({
  faq,
  index,
  onEdit,
  onRemove,
}: {
  faq: { question: string; answer: string };
  index: number;
  onEdit: (index: number, question: string, answer: string) => void;
  onRemove: (index: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState(faq.question);
  const [editAnswer, setEditAnswer] = useState(faq.answer);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = () => {
    if (editQuestion.trim() && editAnswer.trim()) {
      onEdit(index, editQuestion.trim(), editAnswer.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <input
              type="text"
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter your question..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Answer
            </label>
            <textarea
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Enter your answer..."
            />
          </div>
          <div className="flex gap-2">
            <OrangeButton
              onClick={handleSave}
              disabled={!editQuestion.trim() || !editAnswer.trim()}
              className="text-sm"
            >
              Save
            </OrangeButton>
            <WhiteButton onClick={handleCancel} className="text-sm">
              Cancel
            </WhiteButton>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="font-medium text-gray-900 pr-2">
                  {faq.question}
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isExpanded && (
                <div className="mt-3 text-gray-600 text-sm leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
            <button
              onClick={() => onRemove(index)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced SEO Quality Indicator Component
const SEOQualityIndicator = ({
  seoQuality,
  onTogglePreview,
}: {
  seoQuality: SEOQuality | null;
  onTogglePreview: () => void;
}) => {
  if (!seoQuality) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80)
      return "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200";
    if (score >= 60)
      return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
    return "bg-gradient-to-r from-red-50 to-pink-50 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  return (
    <div
      className={`p-6 rounded-xl border-2 ${getScoreBgColor(
        seoQuality.overallScore
      )} shadow-lg`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getScoreColor(
              seoQuality.overallScore
            )} bg-white shadow-lg border-4 border-white`}
          >
            {seoQuality.overallScore}
          </div>
          <div>
            <span className="font-bold text-gray-800 text-xl">
              SEO Quality Score
            </span>
            <div className="text-sm text-gray-600 mt-1">
              {getScoreLabel(seoQuality.overallScore)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {seoQuality.overallScore >= 80
                ? "Excellent optimization for search engines"
                : seoQuality.overallScore >= 60
                ? "Good optimization with room for improvement"
                : "Needs significant improvement for better visibility"}
            </div>
          </div>
        </div>
        <WhiteButton
          onClick={onTogglePreview}
          className="flex items-center gap-2 text-sm shadow-md"
        >
          <Eye className="w-4 h-4" />
          View Details
        </WhiteButton>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div
            className={`text-3xl font-bold ${getScoreColor(
              seoQuality.metaTitle.score
            )} mb-1`}
          >
            {seoQuality.metaTitle.score}
          </div>
          <div className="text-gray-700 text-sm font-semibold mb-1">
            Meta Title
          </div>
          <div className="text-xs text-gray-500">
            {seoQuality.metaTitle.score >= 80
              ? "Perfect length & keywords"
              : seoQuality.metaTitle.score >= 60
              ? "Good optimization"
              : "Needs improvement"}
          </div>
        </div>
        <div className="text-center bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div
            className={`text-3xl font-bold ${getScoreColor(
              seoQuality.metaDescription.score
            )} mb-1`}
          >
            {seoQuality.metaDescription.score}
          </div>
          <div className="text-gray-700 text-sm font-semibold mb-1">
            Description
          </div>
          <div className="text-xs text-gray-500">
            {seoQuality.metaDescription.score >= 80
              ? "Compelling & optimized"
              : seoQuality.metaDescription.score >= 60
              ? "Good description"
              : "Needs work"}
          </div>
        </div>
        <div className="text-center bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div
            className={`text-3xl font-bold ${getScoreColor(
              seoQuality.keywords.score
            )} mb-1`}
          >
            {seoQuality.keywords.score}
          </div>
          <div className="text-gray-700 text-sm font-semibold mb-1">
            Keywords
          </div>
          <div className="text-xs text-gray-500">
            {seoQuality.keywords.score >= 80
              ? "Well targeted"
              : seoQuality.keywords.score >= 60
              ? "Good selection"
              : "Needs more keywords"}
          </div>
        </div>
      </div>

      {/* Enhanced Quick Tips */}
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
        <div className="flex items-center gap-3 text-sm text-gray-700 mb-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-semibold">SEO Optimization Tips</span>
        </div>
        <div className="text-sm text-gray-600 space-y-2">
          {seoQuality.overallScore < 80 && (
            <>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Use relevant keywords naturally in your course title
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Title will be formatted as &quot;Course Title | Edulyt&quot;</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Include 5-10 targeted keywords (maximum 10) for better search
                  visibility
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Make description compelling and include a call-to-action
                </span>
              </div>
            </>
          )}
          {seoQuality.overallScore >= 80 && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-green-800 font-medium">
                  Excellent SEO Optimization!
                </div>
                <div className="text-green-700 text-xs">
                  Your course is well-optimized for search engines and should
                  rank better in search results.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced SEO Quality Details Modal
const SEOQualityDetails = ({
  seoQuality,
  onClose,
}: {
  seoQuality: SEOQuality;
  onClose: () => void;
}) => {
  const renderIssuesList = (issues: string[], suggestions: string[]) => (
    <div className="space-y-3">
      {issues.map((issue, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
        >
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <span className="text-red-700 text-sm">{issue}</span>
        </div>
      ))}
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
        >
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <span className="text-blue-700 text-sm">{suggestion}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                SEO Quality Analysis
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Overall Score */}
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">
                  Overall SEO Score
                </h4>
                <p className="text-sm text-gray-600">
                  Based on title, description, and keywords optimization
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">
                  {seoQuality.overallScore}/100
                </div>
                <div className="text-sm text-gray-600">
                  {seoQuality.overallScore >= 80
                    ? "Excellent"
                    : seoQuality.overallScore >= 60
                    ? "Good"
                    : "Needs Improvement"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Meta Title Analysis */}
            <div className="border-2 border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Meta Title Analysis
                </h4>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      seoQuality.metaTitle.score >= 80
                        ? "text-green-600"
                        : seoQuality.metaTitle.score >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {seoQuality.metaTitle.score}/100
                  </div>
                </div>
              </div>
              {seoQuality.metaTitle.issues.length > 0 ||
              seoQuality.metaTitle.suggestions.length > 0 ? (
                renderIssuesList(
                  seoQuality.metaTitle.issues,
                  seoQuality.metaTitle.suggestions
                )
              ) : (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <span className="text-green-700 font-medium">
                      Meta title looks excellent!
                    </span>
                    <div className="text-sm text-green-600">
                      Your title is well-optimized for search engines.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Meta Description Analysis */}
            <div className="border-2 border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-500" />
                  Meta Description Analysis
                </h4>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      seoQuality.metaDescription.score >= 80
                        ? "text-green-600"
                        : seoQuality.metaDescription.score >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {seoQuality.metaDescription.score}/100
                  </div>
                </div>
              </div>
              {seoQuality.metaDescription.issues.length > 0 ||
              seoQuality.metaDescription.suggestions.length > 0 ? (
                renderIssuesList(
                  seoQuality.metaDescription.issues,
                  seoQuality.metaDescription.suggestions
                )
              ) : (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <span className="text-green-700 font-medium">
                      Meta description looks excellent!
                    </span>
                    <div className="text-sm text-green-600">
                      Your description is well-optimized for search engines.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Keywords Analysis */}
            <div className="border-2 border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  SEO Keywords Analysis
                </h4>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      seoQuality.keywords.score >= 80
                        ? "text-green-600"
                        : seoQuality.keywords.score >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {seoQuality.keywords.score}/100
                  </div>
                </div>
              </div>
              {seoQuality.keywords.issues.length > 0 ||
              seoQuality.keywords.suggestions.length > 0 ? (
                renderIssuesList(
                  seoQuality.keywords.issues,
                  seoQuality.keywords.suggestions
                )
              ) : (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <span className="text-green-700 font-medium">
                      Keywords look excellent!
                    </span>
                    <div className="text-sm text-green-600">
                      Your keyword strategy is well-optimized.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <WhiteButton onClick={onClose} className="px-6">
              Close Analysis
            </WhiteButton>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced FAQ Template Selector
const FAQTemplateSelector = ({
  onAddFAQs,
}: {
  onAddFAQs: (faqs: { question: string; answer: string }[]) => void;
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTemplate = (
    categoryFAQs: { question: string; answer: string }[]
  ) => {
    onAddFAQs(categoryFAQs);
    setIsOpen(false);
    setSelectedCategory("");
  };

  return (
    <div className="relative">
      <WhiteButton
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        Add from Templates
      </WhiteButton>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">FAQ Templates</h3>
            <p className="text-sm text-gray-600">
              Choose a category to add common FAQ questions
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(FAQ_TEMPLATES).map(([category, faqs]) => (
              <div
                key={category}
                className="border-b border-gray-100 last:border-b-0"
              >
                <button
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category ? "" : category
                    )
                  }
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-gray-800">{category}</h4>
                    <p className="text-sm text-gray-600">{faqs.length} FAQs</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      selectedCategory === category ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {selectedCategory === category && (
                  <div className="px-4 pb-4">
                    <div className="space-y-3 mb-3">
                      {faqs.map((faq, index) => (
                        <div key={index} className="bg-gray-50 rounded-md p-3">
                          <div className="font-medium text-sm text-gray-800 mb-1">
                            {faq.question}
                          </div>
                          <div className="text-xs text-gray-600">
                            {faq.answer}
                          </div>
                        </div>
                      ))}
                    </div>
                    <OrangeButton
                      onClick={() => handleAddTemplate(faqs)}
                      className="w-full text-sm"
                    >
                      Add All {faqs.length} FAQs
                    </OrangeButton>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <WhiteButton
              onClick={() => setIsOpen(false)}
              className="w-full text-sm"
            >
              Close
            </WhiteButton>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced FAQ Manager
const FAQManager = ({
  faqs = [],
  onUpdateFAQs,
}: {
  faqs: { question: string; answer: string }[];
  onUpdateFAQs: (faqs: { question: string; answer: string }[]) => void;
}) => {
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  const addFAQ = () => {
    if (newQuestion.trim() && newAnswer.trim()) {
      const updatedFAQs = [
        ...faqs,
        { question: newQuestion.trim(), answer: newAnswer.trim() },
      ];
      onUpdateFAQs(updatedFAQs);
      setNewQuestion("");
      setNewAnswer("");
      setIsAddingNew(false);
    }
  };

  const addMultipleFAQs = (newFAQs: { question: string; answer: string }[]) => {
    const updatedFAQs = [...faqs, ...newFAQs];
    onUpdateFAQs(updatedFAQs);
  };

  const removeFAQ = (index: number) => {
    const updatedFAQs = faqs.filter((_, i) => i !== index);
    onUpdateFAQs(updatedFAQs);
  };

  const editFAQ = (index: number, question: string, answer: string) => {
    const updatedFAQs = faqs.map((faq, i) =>
      i === index ? { question, answer } : faq
    );
    onUpdateFAQs(updatedFAQs);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Frequently Asked Questions
          </h3>
          <p className="text-sm text-gray-600">
            {faqs.length} FAQ{faqs.length !== 1 ? "s" : ""} added
          </p>
        </div>
        <div className="flex gap-2">
          <FAQTemplateSelector onAddFAQs={addMultipleFAQs} />
          <OrangeButton
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="flex items-center gap-2 text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add FAQ
          </OrangeButton>
        </div>
      </div>

      {/* Add New FAQ Form */}
      {isAddingNew && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">Add New FAQ</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Enter your question..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer
              </label>
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                rows={3}
                placeholder="Enter your answer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-2">
              <OrangeButton
                onClick={addFAQ}
                disabled={!newQuestion.trim() || !newAnswer.trim()}
                className="text-sm"
              >
                Add FAQ
              </OrangeButton>
              <WhiteButton
                onClick={() => {
                  setIsAddingNew(false);
                  setNewQuestion("");
                  setNewAnswer("");
                }}
                className="text-sm"
              >
                Cancel
              </WhiteButton>
            </div>
          </div>
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium mb-2">No FAQs added yet</p>
            <p className="text-sm">
              Add FAQs manually or use templates to get started
            </p>
          </div>
        ) : (
          faqs.map((faq, index) => (
            <FAQCard
              key={index}
              faq={faq}
              index={index}
              onEdit={editFAQ}
              onRemove={removeFAQ}
            />
          ))
        )}
      </div>

      {/* FAQ Statistics */}
      {faqs.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total FAQs</span>
            <span className="text-gray-800 font-medium">{faqs.length}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Having 5-10 FAQs helps address common student questions and improves
            course appeal.
          </div>
        </div>
      )}
    </div>
  );
};

const Screen6 = () => {
  const { state, actions } = useEditCourseContext();
  const { setActiveScreen } = useEditScreen();
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [slugValidation, setSlugValidation] = useState({
    isValid: true,
    message: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [seoQuality, setSeoQuality] = useState<SEOQuality | null>(null);
  const [showSeoPreview, setShowSeoPreview] = useState(false);

  // Auto-generate slug from title when title changes (only if slug hasn't been manually edited)
  useEffect(() => {
    if (state.course.title && !isSlugManuallyEdited) {
      const autoGeneratedSlug = generateSlugFromTitle(state.course.title);
      if (autoGeneratedSlug !== state.course.slug) {
        actions.setCourseSlug(autoGeneratedSlug);
      }
    }
  }, [state.course.title, isSlugManuallyEdited, actions]);

  // Validate slug whenever it changes
  useEffect(() => {
    if (state.course.slug) {
      const validation = validateSlug(state.course.slug);
      setSlugValidation(validation);
    } else {
      setSlugValidation({ isValid: false, message: "Slug is required" });
    }
  }, [state.course.slug]);

  const handleSlugChange = (value: string) => {
    setIsSlugManuallyEdited(true);
    const formattedSlug = value
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-");
    actions.setCourseSlug(formattedSlug);
  };

  const handleRegenerateSlug = () => {
    if (state.course.title) {
      const newSlug = generateSlugFromTitle(state.course.title);
      actions.setCourseSlug(newSlug);
      setIsSlugManuallyEdited(false);
    }
  };

  // Auto-generate SEO fields
  const handleAutoGenerateSEO = async () => {
    setIsGenerating(true);

    try {
      // Simulate a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      const generatedSEO = generateCompleteSEO(state.course);

      // Update the course with generated SEO fields
      actions.setCourseMetaTitle(generatedSEO.metaTitle);
      actions.setCourseMetaDescription(generatedSEO.metaDescription);
      actions.setCourseKeywords(generatedSEO.keywords);

      // Update SEO quality after generation
      updateSeoQuality();
    } catch (error) {
      console.error("Error generating SEO:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Update SEO quality analysis
  const updateSeoQuality = () => {
    const quality = checkSEOQuality(state.course);
    setSeoQuality(quality);
  };

  // Check SEO quality when relevant fields change
  useEffect(() => {
    updateSeoQuality();
  }, [
    state.course.metaTitle,
    state.course.metaDescription,
    state.course.keywords,
  ]);

  // Auto-generate individual fields
  const handleGenerateMetaTitle = () => {
    const generatedSEO = generateCompleteSEO(state.course);
    actions.setCourseMetaTitle(generatedSEO.metaTitle);
  };

  const handleGenerateMetaDescription = () => {
    const generatedSEO = generateCompleteSEO(state.course);
    actions.setCourseMetaDescription(generatedSEO.metaDescription);
  };

  const handleGenerateKeywords = () => {
    const generatedSEO = generateCompleteSEO(state.course);
    actions.setCourseKeywords(generatedSEO.keywords);
  };

  return (
    <Container
      title="FAQs & SEO"
      description="Add frequently asked questions and SEO information"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Enhanced SEO Auto-Generation Section */}
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                SEO Auto-Generation
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Generate optimized SEO fields automatically based on your course
                content
              </p>
            </div>
          </div>
          <OrangeButton
            onClick={handleAutoGenerateSEO}
            disabled={isGenerating || !state.course.title}
            className="flex items-center gap-3 shadow-lg px-6 py-3"
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isGenerating ? "Generating..." : "Auto-Generate All"}
          </OrangeButton>
        </div>

        {/* SEO Quality Indicator */}
        {seoQuality && (
          <SEOQualityIndicator
            seoQuality={seoQuality}
            onTogglePreview={() => setShowSeoPreview(true)}
          />
        )}

        {!state.course.title && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-5 shadow-md">
            <div className="flex items-center gap-4 text-yellow-700">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <span className="font-semibold text-lg">
                  Course Title Required
                </span>
                <div className="text-sm mt-1">
                  Please add a course title first to enable SEO auto-generation.
                  The title helps generate relevant meta tags and keywords.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Meta Title */}
      <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <label className="block text-sm font-semibold text-gray-700">
              Meta Title <span className="text-red-500">*</span>
            </label>
          </div>
          <WhiteButton
            onClick={handleGenerateMetaTitle}
            disabled={!state.course.title}
            className="text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Auto-generate
          </WhiteButton>
        </div>
        <input
          type="text"
          name="metaTitle"
          placeholder="Enter course title (will be formatted as 'Title | Edulyt')"
          value={state.course.metaTitle || ""}
          onChange={(e) => actions.setCourseMetaTitle(e.target.value)}
          maxLength={60}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-sm"
        />
        <div className="mt-2 flex justify-between text-sm text-gray-500">
          <span>Format: &quot;Course Title | Edulyt&quot; (max 60 characters)</span>
          <span
            className={
              (state.course.metaTitle?.length || 0) > 60
                ? "text-red-500 font-medium"
                : "text-gray-500"
            }
          >
            {state.course.metaTitle?.length || 0}/60
          </span>
        </div>
      </div>

      {/* Course Slug */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Course Slug <span className="text-red-500">*</span>
          </label>
          {state.course.title && (
            <WhiteButton
              onClick={handleRegenerateSlug}
              className="text-sm flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Regenerate from title
            </WhiteButton>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            name="slug"
            placeholder="Enter course URL slug (e.g., javascript-fundamentals)"
            value={state.course.slug || ""}
            onChange={(e) => handleSlugChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              slugValidation.isValid
                ? "border-gray-300 focus:ring-orange-500 focus:border-transparent"
                : "border-red-300 focus:ring-red-500 focus:border-red-300"
            }`}
          />

          {/* URL Preview */}
          {state.course.slug && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-600 mb-1">
                Course URL Preview: (Do not change this manually unless needed)
              </p>
              <p className="text-sm font-mono text-gray-800 break-all">
                <span className="text-gray-500">
                  https://www.edulyt.com/courses/
                </span>
                <span
                  className={
                    slugValidation.isValid ? "text-green-600" : "text-red-600"
                  }
                >
                  {state.course.slug}
                </span>
              </p>
            </div>
          )}

          {/* Validation Message */}
          {!slugValidation.isValid && slugValidation.message && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {slugValidation.message}
            </div>
          )}

          {/* Help Text */}
          <div className="mt-2 text-sm text-gray-500">
            <p>
              The slug is used in the course URL. It should be unique,
              SEO-friendly, and contain only lowercase letters, numbers, and
              hyphens.
            </p>
            {isSlugManuallyEdited ? (
              <p className="text-orange-600 mt-1">
                <svg
                  className="w-4 h-4 inline mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Manually edited - won&apos;t auto-update from title
              </p>
            ) : (
              <p className="text-green-600 mt-1">
                <svg
                  className="w-4 h-4 inline mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Auto-generated from course title
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Meta Description */}
      <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-green-600" />
            </div>
            <label className="block text-sm font-semibold text-gray-700">
              Meta Description <span className="text-red-500">*</span>
            </label>
          </div>
          <WhiteButton
            onClick={handleGenerateMetaDescription}
            disabled={!state.course.title}
            className="text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Auto-generate
          </WhiteButton>
        </div>
        <textarea
          name="metaDescription"
          placeholder="Enter SEO meta description (max 160 characters)"
          value={state.course.metaDescription || ""}
          onChange={(e) => actions.setCourseMetaDescription(e.target.value)}
          maxLength={160}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none text-sm"
        />
        <div className="mt-2 flex justify-between text-sm text-gray-500">
          <span>Optimal length: 120-160 characters</span>
          <span
            className={
              (state.course.metaDescription?.length || 0) > 160
                ? "text-red-500 font-medium"
                : "text-gray-500"
            }
          >
            {state.course.metaDescription?.length || 0}/160
          </span>
        </div>
      </div>

      {/* SEO Keywords */}
      <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-600" />
            </div>
            <label className="block text-sm font-semibold text-gray-700">
              SEO Keywords <span className="text-red-500">*</span>
            </label>
          </div>
          <WhiteButton
            onClick={handleGenerateKeywords}
            disabled={!state.course.title}
            className="text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Auto-generate
          </WhiteButton>
        </div>
        <TagInput
          placeholder="Add SEO keywords (e.g., javascript, web development, programming)"
          tags={state.course.keywords}
          onChange={(keywords) => actions.setCourseKeywords(keywords)}
          maxTags={10}
          className="w-full"
        />
        <div className="mt-2 text-sm text-gray-500">
          Optimal: 5-10 relevant keywords (max 10) • Current:{" "}
          {state.course.keywords?.length || 0} keywords
        </div>
      </div>

      {/* Enhanced FAQ Management */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <FAQManager
          faqs={state.course.faqs || []}
          onUpdateFAQs={(faqs) => actions.setCourseFaqs(faqs)}
        />
      </div>

      <ScreenNavigation
        currentStep={6}
        previousScreen="screen5"
        nextScreen="screen7"
        setActiveScreen={setActiveScreen}
        isNextDisabled={
          !state.course.metaTitle ||
          !state.course.slug ||
          !slugValidation.isValid ||
          !state.course.metaDescription ||
          (state.course.keywords?.length || 0) === 0 ||
          (state.course.faqs?.length || 0) === 0
        }
      />

      {/* SEO Quality Details Modal */}
      {showSeoPreview && seoQuality && (
        <SEOQualityDetails
          seoQuality={seoQuality}
          onClose={() => setShowSeoPreview(false)}
        />
      )}
    </Container>
  );
};

export default Screen6;
