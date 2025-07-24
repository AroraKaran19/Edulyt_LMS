"use client";
import React, { useState } from "react";
import Container from "@/app/(pages)/admin/components/ui/Container";
import { HelpCircle, X, Edit, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useCourseFormContext } from "../context/CourseFormContext";
import { FAQ } from "@/types/course";

const FAQSection = () => {
  const {
    state,
    addFAQ,
    removeFAQ,
    updateField,
  } = useCourseFormContext();

  const [newFAQ, setNewFAQ] = useState<Partial<FAQ>>({
    _id: '',
    question: '',
    answer: '',
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedFAQs, setExpandedFAQs] = useState<Record<string, boolean>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleAddFAQ = () => {
    if (newFAQ.question && newFAQ.answer) {
      const faqToAdd: FAQ = {
        _id: Date.now().toString(),
        question: newFAQ.question!,
        answer: newFAQ.answer!,
      };

      if (editingIndex !== null) {
        // Update existing FAQ by removing old one and adding new one
        removeFAQ(editingIndex);
        addFAQ(faqToAdd);
        setEditingIndex(null);
      } else {
        addFAQ(faqToAdd);
      }

      setNewFAQ({
        _id: '',
        question: '',
        answer: '',
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
    });
    setEditingIndex(null);
  };

  const toggleExpandFAQ = (faqId: string) => {
    setExpandedFAQs(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newFAQs = [...state.faqs];
    const draggedFAQ = newFAQs[draggedIndex];
    
    // Remove the dragged item
    newFAQs.splice(draggedIndex, 1);
    
    // Insert at new position
    newFAQs.splice(dropIndex, 0, draggedFAQ);
    
    // Update the state
    updateField('faqs', newFAQs);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">Course FAQs</h3>
              {state.faqs.length > 1 && (
                <p className="text-sm text-gray-500">Drag to reorder</p>
              )}
            </div>
            <div className="space-y-3">
              {state.faqs.map((faq, index) => (
                <div 
                  key={faq._id} 
                  className={`bg-white border border-gray-200 rounded-lg transition-all duration-200 ${
                    draggedIndex === index ? 'opacity-50 scale-95' : ''
                  } ${
                    dragOverIndex === index ? 'border-orange-400 shadow-md' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Drag Handle */}
                        <div className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing">
                          <GripVertical className="size-4 text-gray-400 hover:text-gray-600" />
                        </div>
                        
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
                      </div>
                      
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
                      <div className="mt-4 pl-10">
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
      </div>
    </Container>
  );
};

export default FAQSection; 