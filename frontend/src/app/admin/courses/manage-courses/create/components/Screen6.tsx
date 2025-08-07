import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React, { useState, useEffect } from "react";
import { useCourseContext } from "../../../course-reducer/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useScreen } from "../contexts/ScreenContext";
import TagInput from "@/components/ui/inputs/TagInput";

// Utility function to generate slug from title
const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
};

// Utility function to validate slug
const validateSlug = (slug: string): { isValid: boolean; message: string } => {
  if (!slug) {
    return { isValid: false, message: 'Slug is required' };
  }
  
  if (slug.length < 3) {
    return { isValid: false, message: 'Slug must be at least 3 characters long' };
  }
  
  if (slug.length > 100) {
    return { isValid: false, message: 'Slug must be less than 100 characters' };
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { isValid: false, message: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }
  
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { isValid: false, message: 'Slug cannot start or end with a hyphen' };
  }
  
  if (slug.includes('--')) {
    return { isValid: false, message: 'Slug cannot contain consecutive hyphens' };
  }
  
  return { isValid: true, message: '' };
};

// FAQ Templates for quick selection
const FAQ_TEMPLATES = {
  'General Course Questions': [
    {
      question: 'How long do I have access to the course?',
      answer: 'You have lifetime access to the course materials once enrolled.'
    },
    {
      question: 'Is there a certificate upon completion?',
      answer: 'Yes, you will receive a certificate of completion after finishing all course modules.'
    },
    {
      question: 'What if I have questions during the course?',
      answer: 'You can ask questions in the course discussion forum or contact our support team.'
    }
  ],
  'Technical Requirements': [
    {
      question: 'What are the technical requirements for this course?',
      answer: 'You need a computer with internet access and a modern web browser. No special software required.'
    },
    {
      question: 'Can I access the course on mobile devices?',
      answer: 'Yes, the course is fully responsive and works on smartphones and tablets.'
    },
    {
      question: 'Do I need any prior experience?',
      answer: 'This course is designed for beginners. No prior experience is required.'
    }
  ],
  'Support & Refunds': [
    {
      question: 'Is there a money-back guarantee?',
      answer: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied with the course.'
    },
    {
      question: 'How can I get help if I\'m stuck?',
      answer: 'You can reach out through the course forum, email support, or schedule a one-on-one session.'
    },
    {
      question: 'Can I download the course materials?',
      answer: 'Yes, most course materials are available for download for offline viewing.'
    }
  ]
};

// FAQ Card Component
const FAQCard = ({ 
  faq, 
  index, 
  onEdit, 
  onRemove 
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <input
              type="text"
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter your question..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
            <textarea
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Enter your answer..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!editQuestion.trim() || !editAnswer.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              Cancel
            </button>
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
                <h3 className="font-medium text-gray-900 pr-2">{faq.question}</h3>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => onRemove(index)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// FAQ Template Selector
const FAQTemplateSelector = ({ 
  onAddFAQs 
}: { 
  onAddFAQs: (faqs: { question: string; answer: string }[]) => void;
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTemplate = (categoryFAQs: { question: string; answer: string }[]) => {
    onAddFAQs(categoryFAQs);
    setIsOpen(false);
    setSelectedCategory('');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Add from Templates
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">FAQ Templates</h3>
            <p className="text-sm text-gray-600">Choose a category to add common FAQ questions</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(FAQ_TEMPLATES).map(([category, faqs]) => (
              <div key={category} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-gray-800">{category}</h4>
                    <p className="text-sm text-gray-600">{faqs.length} FAQs</p>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${selectedCategory === category ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {selectedCategory === category && (
                  <div className="px-4 pb-4">
                    <div className="space-y-3 mb-3">
                      {faqs.map((faq, index) => (
                        <div key={index} className="bg-gray-50 rounded-md p-3">
                          <div className="font-medium text-sm text-gray-800 mb-1">{faq.question}</div>
                          <div className="text-xs text-gray-600">{faq.answer}</div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleAddTemplate(faqs)}
                      className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                    >
                      Add All {faqs.length} FAQs
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced FAQ Manager
const FAQManager = ({ 
  faqs = [], 
  onUpdateFAQs 
}: {
  faqs: { question: string; answer: string }[];
  onUpdateFAQs: (faqs: { question: string; answer: string }[]) => void;
}) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const addFAQ = () => {
    if (newQuestion.trim() && newAnswer.trim()) {
      const updatedFAQs = [...faqs, { question: newQuestion.trim(), answer: newAnswer.trim() }];
      onUpdateFAQs(updatedFAQs);
      setNewQuestion('');
      setNewAnswer('');
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
          <h3 className="text-lg font-semibold text-gray-800">Frequently Asked Questions</h3>
          <p className="text-sm text-gray-600">
            {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''} added
          </p>
        </div>
        <div className="flex gap-2">
          <FAQTemplateSelector onAddFAQs={addMultipleFAQs} />
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add FAQ
          </button>
        </div>
      </div>

      {/* Add New FAQ Form */}
      {isAddingNew && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">Add New FAQ</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Enter your question..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                rows={3}
                placeholder="Enter your answer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addFAQ}
                disabled={!newQuestion.trim() || !newAnswer.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Add FAQ
              </button>
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setNewQuestion('');
                  setNewAnswer('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium mb-2">No FAQs added yet</p>
            <p className="text-sm">Add FAQs manually or use templates to get started</p>
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
            Having 5-10 FAQs helps address common student questions and improves course appeal.
          </div>
        </div>
      )}
    </div>
  );
};

const Screen6 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [slugValidation, setSlugValidation] = useState({ isValid: true, message: '' });

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
      setSlugValidation({ isValid: false, message: 'Slug is required' });
    }
  }, [state.course.slug]);

  const handleSlugChange = (value: string) => {
    setIsSlugManuallyEdited(true);
    const formattedSlug = value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');
    actions.setCourseSlug(formattedSlug);
  };

  const handleRegenerateSlug = () => {
    if (state.course.title) {
      const newSlug = generateSlugFromTitle(state.course.title);
      actions.setCourseSlug(newSlug);
      setIsSlugManuallyEdited(false);
    }
  };

  return (
    <Container
      title="FAQs & SEO"
      description="Add frequently asked questions and SEO information"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      <Input
        label="Meta Title"
        name="metaTitle"
        placeholder="Enter SEO meta title"
        value={state.course.metaTitle}
        onChange={(e) => actions.setCourseMetaTitle(e.target.value)}
        className="w-full"
        required
      />

      {/* Course Slug */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Course Slug <span className="text-red-500">*</span>
          </label>
          {state.course.title && (
            <button
              type="button"
              onClick={handleRegenerateSlug}
              className="text-sm text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
              title="Generate slug from course title"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate from title
            </button>
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
                ? 'border-gray-300 focus:ring-orange-500 focus:border-transparent' 
                : 'border-red-300 focus:ring-red-500 focus:border-red-300'
            }`}
          />
          
          {/* URL Preview */}
          {state.course.slug && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-600 mb-1">Course URL Preview: (Do not change this manually unless needed)</p>
              <p className="text-sm font-mono text-gray-800 break-all">
                <span className="text-gray-500">https://www.edulyt.com/courses/</span>
                <span className={slugValidation.isValid ? 'text-green-600' : 'text-red-600'}>
                  {state.course.slug}
                </span>
              </p>
            </div>
          )}
          
          {/* Validation Message */}
          {!slugValidation.isValid && slugValidation.message && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {slugValidation.message}
            </div>
          )}
          
          {/* Help Text */}
          <div className="mt-2 text-sm text-gray-500">
            <p>The slug is used in the course URL. It should be unique, SEO-friendly, and contain only lowercase letters, numbers, and hyphens.</p>
            {isSlugManuallyEdited ? (
              <p className="text-orange-600 mt-1">
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Manually edited - won't auto-update from title
              </p>
            ) : (
              <p className="text-green-600 mt-1">
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Auto-generated from course title
              </p>
            )}
          </div>
        </div>
      </div>

      <TextArea
        label="Meta Description"
        name="metaDescription"
        placeholder="Enter SEO meta description"
        value={state.course.metaDescription}
        onChange={(e) => actions.setCourseMetaDescription(e.target.value)}
        className="w-full"
        rows={3}
        lockHeight
        required
      />

      <TagInput
        label="SEO Keywords"
        placeholder="Add SEO keywords (e.g., javascript, web development, programming)"
        tags={state.course.keywords}
        onChange={(keywords) => actions.setCourseKeywords(keywords)}
        className="w-full"
        required
      />

      {/* Enhanced FAQ Management */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <FAQManager
          faqs={state.course.faqs || []}
          onUpdateFAQs={(faqs) => actions.setCourseFaqs(faqs)}
        />
      </div>

      <FlexBox className="w-full gap-4 mt-auto mb-4 justify-between">
        <OrangeButton
          className="w-max px-16"
          onClick={() => setActiveScreen("screen5")}
        >
          Previous
        </OrangeButton>

        <FlexBox className="gap-4 items-center">
          {/* Progress indicator */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
            <span>Step 6 of 8</span>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: "75%" }}
              ></div>
            </div>
          </div>

          <OrangeButton
            className="w-max px-16"
            onClick={() => setActiveScreen("screen7")}
            disabled={
              !state.course.metaTitle ||
              !state.course.slug ||
              !slugValidation.isValid ||
              !state.course.metaDescription ||
              (state.course.keywords?.length || 0) === 0 ||
              (state.course.faqs?.length || 0) === 0
            }
          >
            Next Page
          </OrangeButton>
        </FlexBox>
      </FlexBox>
    </Container>
  );
};

export default Screen6; 