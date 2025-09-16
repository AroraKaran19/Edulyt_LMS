import Container from "@/app/admin/components/ui/Container";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import Input from "@/components/ui/inputs/Input";
import React, { useState } from "react";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import ScreenNavigation from "./shared/ScreenNavigation";
import {
  Plus,
  Trash2,
  Award,
  Users,
  Star,
  Quote,
  HelpCircle,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { useScreen } from "../contexts/ScreenContext";
import { Testimonial, FAQ } from "@/types";

// Simple testimonial form interface for the UI
interface TestimonialForm {
  name: string;
  currentRole: string;
  currentCompany?: string;
  comment: string;
  profileImage?: string;
}

const Screen7 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();

  // Local state for forms
  const [newTestimonial, setNewTestimonial] = useState<TestimonialForm>({
    name: "",
    currentRole: "",
    currentCompany: "",
    comment: "",
    profileImage: "",
  });

  const [newFAQ, setNewFAQ] = useState<FAQ>({
    question: "",
    answer: "",
  });

  // Add testimonial
  const addTestimonial = () => {
    if (newTestimonial.name.trim() && newTestimonial.comment.trim()) {
      const testimonials = state.course.testimonials || [];
      // Convert form data to Testimonial format
      const testimonial: any = {
        name: newTestimonial.name,
        comment: newTestimonial.comment,
        rating: 5, // Default rating
        currentRole: newTestimonial.currentRole,
        currentCompany: newTestimonial.currentCompany || "",
        profileImage: newTestimonial.profileImage || "",
        reviewableType: "Course",
        reviewableId: state.course._id || "",
        pastRole: newTestimonial.currentRole,
        pastCompany: newTestimonial.currentCompany || "",
        linkedin: "",
        isActive: true,
      };
      testimonials.push(testimonial as Testimonial);
      actions.updateCourseField("testimonials", testimonials);

      // Reset form
      setNewTestimonial({
        name: "",
        currentRole: "",
        currentCompany: "",
        comment: "",
        profileImage: "",
      });
    }
  };

  // Remove testimonial
  const removeTestimonial = (index: number) => {
    const testimonials = state.course.testimonials || [];
    testimonials.splice(index, 1);
    actions.updateCourseField("testimonials", testimonials);
  };

  // Add FAQ
  const addFAQ = () => {
    if (newFAQ.question.trim() && newFAQ.answer.trim()) {
      const faqs = state.course.faqs || [];
      faqs.push({ ...newFAQ });
      actions.setCourseFaqs(faqs);

      // Reset form
      setNewFAQ({
        question: "",
        answer: "",
      });
    }
  };

  // Remove FAQ
  const removeFAQ = (index: number) => {
    const faqs = state.course.faqs || [];
    faqs.splice(index, 1);
    actions.setCourseFaqs(faqs);
  };

  // Render star rating
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  // Validation
  const hasValidationErrors = () => {
    // Optional sections, no strict validation required
    return false;
  };

  return (
    <Container
      title="Course Details - Testimonials & FAQs"
      description="Add social proof and answer common questions"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Course Requirements & Prerequisites */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Course Requirements & Prerequisites
            </h3>
            <p className="text-sm text-gray-600">
              What should students know before taking this course?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <TextArea
              label="Course Requirements"
              placeholder="List the requirements for this course (e.g., basic programming knowledge, computer with internet)"
              value={state.course.prerequisites?.join(", ") || ""}
              onChange={(e) =>
                actions.updateCourseField(
                  "prerequisites",
                  e.target.value.split(", ").filter((p) => p.trim())
                )
              }
              rows={4}
              className="w-full"
            />
          </div>
          <div>
            <Input
              label="Additional Notes (Optional)"
              placeholder="Any additional information about prerequisites"
              value={state.course.shortDescription || ""}
              onChange={(e) =>
                actions.updateCourseField("shortDescription", e.target.value)
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Student Testimonials
              </h3>
              <p className="text-sm text-gray-600">
                Add reviews from previous students to build trust
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {state.course.testimonials?.length || 0} testimonials
          </div>
        </div>

        {/* Add New Testimonial Form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Testimonial
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Student Name"
              placeholder="Enter student name"
              value={newTestimonial.name}
              onChange={(e) =>
                setNewTestimonial({ ...newTestimonial, name: e.target.value })
              }
              required
            />
            <Input
              label="Current Role"
              placeholder="e.g., Software Developer, Student"
              value={newTestimonial.currentRole}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  currentRole: e.target.value,
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Company (Optional)"
              placeholder="e.g., Google, Microsoft"
              value={newTestimonial.currentCompany}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  currentCompany: e.target.value,
                })
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              {renderStarRating(5)}
            </div>
          </div>

          <TextArea
            label="Testimonial Comment"
            placeholder="What did the student say about your course?"
            value={newTestimonial.comment}
            onChange={(e) =>
              setNewTestimonial({ ...newTestimonial, comment: e.target.value })
            }
            rows={3}
            className="mb-4"
            required
          />

          <Input
            label="Profile Image URL (Optional)"
            placeholder="https://example.com/profile.jpg"
            value={newTestimonial.profileImage}
            onChange={(e) =>
              setNewTestimonial({
                ...newTestimonial,
                profileImage: e.target.value,
              })
            }
          />

          <div className="flex justify-end mt-4">
            <OrangeButton
              onClick={addTestimonial}
              disabled={
                !newTestimonial.name.trim() || !newTestimonial.comment.trim()
              }
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Testimonial
            </OrangeButton>
          </div>
        </div>

        {/* Existing Testimonials */}
        <div className="space-y-4">
          {state.course.testimonials && state.course.testimonials.length > 0 ? (
            state.course.testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {testimonial.profileImage ? (
                        <img
                          src={testimonial.profileImage}
                          alt={testimonial.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <h5 className="font-semibold text-gray-800">
                          {testimonial.name}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {testimonial.currentRole}
                          {testimonial.currentCompany &&
                            ` at ${testimonial.currentCompany}`}
                        </p>
                      </div>
                    </div>

                    <div className="mb-2">
                      {renderStarRating((testimonial as any).rating || 5)}
                    </div>

                    <div className="relative">
                      <Quote className="absolute -top-1 -left-1 w-4 h-4 text-gray-400" />
                      <p className="text-gray-700 italic pl-4">
                        "{(testimonial as any).comment || "No comment"}"
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeTestimonial(index)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No testimonials added yet</p>
              <p className="text-sm">
                Add student reviews to build trust and credibility
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FAQs Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Frequently Asked Questions
              </h3>
              <p className="text-sm text-gray-600">
                Answer common questions students might have
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {state.course.faqs?.length || 0} FAQs
          </div>
        </div>

        {/* Add New FAQ Form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New FAQ
          </h4>

          <div className="space-y-4">
            <Input
              label="Question"
              placeholder="What question do students frequently ask?"
              value={newFAQ.question}
              onChange={(e) =>
                setNewFAQ({ ...newFAQ, question: e.target.value })
              }
              required
            />

            <TextArea
              label="Answer"
              placeholder="Provide a clear and helpful answer"
              value={newFAQ.answer}
              onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end mt-4">
            <OrangeButton
              onClick={addFAQ}
              disabled={!newFAQ.question.trim() || !newFAQ.answer.trim()}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add FAQ
            </OrangeButton>
          </div>
        </div>

        {/* Existing FAQs */}
        <div className="space-y-4">
          {state.course.faqs && state.course.faqs.length > 0 ? (
            state.course.faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="w-4 h-4 text-purple-500" />
                      <h5 className="font-semibold text-gray-800">
                        {faq.question}
                      </h5>
                    </div>
                    <p className="text-gray-700 pl-6">{faq.answer}</p>
                  </div>

                  <button
                    onClick={() => removeFAQ(index)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No FAQs added yet</p>
              <p className="text-sm">
                Add common questions to help students understand your course
                better
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Course Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Additional Information
            </h3>
            <p className="text-sm text-gray-600">
              Extra details about your course
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Course Duration (Optional)"
              placeholder="e.g., 6 weeks, 20 hours"
              value={state.course.duration || ""}
              onChange={(e) =>
                actions.updateCourseField("duration", e.target.value)
              }
            />

            <Input
              label="Course Level"
              placeholder="e.g., Beginner, Intermediate, Advanced"
              value={state.course.skillLevel || ""}
              onChange={(e) =>
                actions.updateCourseField("skillLevel", e.target.value)
              }
            />
          </div>

          <div className="space-y-4">
            <TextArea
              label="Course Completion Benefits (Optional)"
              placeholder="What will students achieve after completing this course?"
              value={state.course.whatYouWillLearn || ""}
              onChange={(e) =>
                actions.updateCourseField("whatYouWillLearn", e.target.value)
              }
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScreenNavigation
        currentStep={6}
        totalSteps={8}
        previousScreen="screen5"
        nextScreen="screen7_modules"
        nextButtonText="Configure Content"
        setActiveScreen={setActiveScreen}
        isNextDisabled={hasValidationErrors()}
      />
    </Container>
  );
};

export default Screen7;
