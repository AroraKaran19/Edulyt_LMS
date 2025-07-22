"use client";
import React, { useState } from "react";
import Container from "@/app/(pages)/admin/components/ui/Container";
import { HelpCircle, X, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { useCourseFormContext } from "../context/CourseFormContext";
import { FAQ } from "@/types/course";

const FAQSection = () => {
  const {
    state,
    addFAQ,
    removeFAQ,
    updateArrayItem,
  } = useCourseFormContext();

  const [newFAQ, setNewFAQ] = useState<Partial<FAQ>>({
    _id: '',
    question: '',
    answer: '',
    order: 0,
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedFAQs, setExpandedFAQs] = useState<Record<string, boolean>>({});

  const handleAddFAQ = () => {
    if (newFAQ.question && newFAQ.answer) {
      const faqToAdd: FAQ = {
        _id: Date.now().toString(),
        question: newFAQ.question!,
        answer: newFAQ.answer!,
        order: state.faqs.length,
      };

      if (editingIndex !== null) {
        updateArrayItem('faqs', editingIndex, faqToAdd);
        setEditingIndex(null);
      } else {
        addFAQ(faqToAdd);
      }

      setNewFAQ({
        _id: '',
        question: '',
        answer: '',
        order: 0,
      });
    }
  };

  const handleEditFAQ = (index: number) => {
    const faq = state.faqs[index];
    setNewFAQ(faq);
    setEditingIndex(index);
  };

  const cancelEdit = () => {
    setNewFAQ({
      _id: '',
      question: '',
      answer: '',
      order: 0,
    });
    setEditingIndex(null);
  };

  const toggleExpandFAQ = (faqId: string) => {
    setExpandedFAQs(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };

  const isFormValid = newFAQ.question && newFAQ.answer;

  return (
    <Container
      id="faqs"
      icon={HelpCircle}
      title="Frequently Asked Questions"
      description="Add common questions and answers about your course"
    >
      <div className="w-full space-y-6">
        {/* Add FAQ Form */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">
              {editingIndex !== null ? 'Edit FAQ' : 'Add New FAQ'}
            </h3>
            {editingIndex !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Question <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter the frequently asked question"
                value={newFAQ.question}
                onChange={(e) => setNewFAQ(prev => ({ ...prev, question: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Answer <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Provide a detailed answer to the question"
                value={newFAQ.answer}
                onChange={(e) => setNewFAQ(prev => ({ ...prev, answer: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleAddFAQ}
              disabled={!isFormValid}
              className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {editingIndex !== null ? 'Update FAQ' : 'Add FAQ'}
            </button>
          </div>
        </div>

        {/* FAQs List */}
        {state.faqs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Course FAQs</h3>
            <div className="space-y-3">
              {state.faqs.map((faq, index) => (
                <div key={faq._id} className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <button
                        type="button"
                        onClick={() => toggleExpandFAQ(faq._id)}
                        className="flex-1 text-left flex items-center gap-3 group"
                      >
                        {expandedFAQs[faq._id] ? (
                          <ChevronUp className="size-5 text-gray-500 group-hover:text-gray-700 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="size-5 text-gray-500 group-hover:text-gray-700 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-800 group-hover:text-gray-900">
                            {faq.question}
                          </h4>
                          {!expandedFAQs[faq._id] && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {faq.answer}
                            </p>
                          )}
                        </div>
                      </button>
                      <div className="flex gap-2 ml-4">
                        <button
                          type="button"
                          onClick={() => handleEditFAQ(index)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <Edit className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFAQ(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>

                    {expandedFAQs[faq._id] && (
                      <div className="mt-4 pl-8">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700 whitespace-pre-wrap">{faq.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Tips */}
        <div className="bg-blue-50 p-6 rounded-lg space-y-3">
          <h3 className="text-lg font-medium text-blue-800">FAQ Tips</h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Address common concerns about course difficulty, prerequisites, and time commitment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Include information about certification, refunds, and course access</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Keep answers concise but comprehensive</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Consider technical requirements and support information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Update FAQs based on actual student questions</span>
            </li>
          </ul>
        </div>
      </div>
    </Container>
  );
};

export default FAQSection; 