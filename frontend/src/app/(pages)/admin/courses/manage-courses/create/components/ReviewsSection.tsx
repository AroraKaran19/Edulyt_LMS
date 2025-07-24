"use client";
import React, { useState } from "react";
import Container from "@/app/(pages)/admin/components/ui/Container";
import { Star, X, Edit, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseFormContext } from "../context/CourseFormContext";
import { Review, FeaturedReview } from "@/types/course";

const ReviewsSection = () => {
  const {
    state,
    addReview,
    removeReview,
    updateField,
    addFeaturedReview,
    removeFeaturedReview,
  } = useCourseFormContext();

  const [activeTab, setActiveTab] = useState<'reviews' | 'featured'>('reviews');
  
  // Regular review state - matches Review type exactly
  const [newReview, setNewReview] = useState<Partial<Review>>({
    _id: '',
    name: '',
    rating: 5,
    comment: '',
    date: new Date(),
    isActive: true,
  });

  // Featured review state - matches FeaturedReview type exactly
  const [newFeaturedReview, setNewFeaturedReview] = useState<Partial<FeaturedReview>>({
    _id: '',
    name: '',
    rating: 5,
    comment: '',
    date: new Date(),
    verified: true,
    isActive: true,
    profileImage: '',
    currentRole: '',
    currentCompany: '',
    pastRole: '',
    pastCompany: '',
    linkedin: '',
  });

  // Additional UI-only fields for display purposes
  const [reviewAvatar, setReviewAvatar] = useState('');

  const [editingReview, setEditingReview] = useState<number | null>(null);
  const [editingFeaturedReview, setEditingFeaturedReview] = useState<number | null>(null);

  // Regular reviews handlers
  const handleAddReview = () => {
    if (newReview.name && newReview.comment && newReview.rating) {
      const reviewToAdd: Review = {
        _id: Date.now().toString(),
        name: newReview.name!,
        rating: newReview.rating!,
        comment: newReview.comment!,
        date: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingReview !== null) {
        updateField('reviews', [...state.reviews, reviewToAdd]);
        setEditingReview(null);
      } else {
        addReview(reviewToAdd);
      }

      setNewReview({
        _id: '',
        name: '',
        rating: 5,
        comment: '',
        date: new Date(),
        isActive: true,
      });
      setReviewAvatar('');
    }
  };

  // Featured reviews handlers
  const handleAddFeaturedReview = () => {
    if (newFeaturedReview.name && newFeaturedReview.comment && newFeaturedReview.rating) {
      const featuredReviewToAdd: FeaturedReview = {
        _id: Date.now().toString(),
        name: newFeaturedReview.name!,
        rating: newFeaturedReview.rating!,
        comment: newFeaturedReview.comment!,
        date: new Date(),
        verified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: newFeaturedReview.profileImage || '',
        currentRole: newFeaturedReview.currentRole || '',
        currentCompany: newFeaturedReview.currentCompany || '',
        pastRole: newFeaturedReview.pastRole || '',
        pastCompany: newFeaturedReview.pastCompany || '',
        linkedin: newFeaturedReview.linkedin || '',
      };

      if (editingFeaturedReview !== null) {
        updateField('featuredReviews', [...(state.featuredReviews || []), featuredReviewToAdd]);
        setEditingFeaturedReview(null);
      } else {
        addFeaturedReview(featuredReviewToAdd);
      }

      setNewFeaturedReview({
        _id: '',
        name: '',
        rating: 5,
        comment: '',
        date: new Date(),
        verified: true,
        isActive: true,
        profileImage: '',
        currentRole: '',
        currentCompany: '',
        pastRole: '',
        pastCompany: '',
        linkedin: '',
      });
    }
  };

  const handleEditReview = (index: number) => {
    const review = state.reviews[index];
    setNewReview(review);
    setEditingReview(index);
  };

  const handleEditFeaturedReview = (index: number) => {
    const review = state.featuredReviews?.[index];
    setNewFeaturedReview(review || {});
    setEditingFeaturedReview(index);
  };

  const cancelEditReview = () => {
    setNewReview({
      _id: '',
      name: '',
      rating: 5,
      comment: '',
      date: new Date(),
      isActive: true,
    });
    setReviewAvatar('');
    setEditingReview(null);
  };

  const cancelEditFeaturedReview = () => {
    setNewFeaturedReview({
      _id: '',
      name: '',
      rating: 5,
      comment: '',
      date: new Date(),
      verified: true,
      isActive: true,
      profileImage: '',
      currentRole: '',
      currentCompany: '',
      pastRole: '',
      pastCompany: '',
      linkedin: '',
    });
    setEditingFeaturedReview(null);
  };

  const renderStars = (rating: number, interactive: boolean = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onChange && onChange(star)}
            className={cn(
              "transition-colors",
              interactive ? "hover:text-yellow-500 cursor-pointer" : "cursor-default",
              star <= rating ? "text-yellow-500" : "text-gray-300"
            )}
            disabled={!interactive}
          >
            <Star className={cn("size-5", star <= rating && "fill-current")} />
          </button>
        ))}
      </div>
    );
  };

  const isReviewFormValid = newReview.name && newReview.comment && newReview.rating;
  const isFeaturedReviewFormValid = 
    newFeaturedReview.name && 
    newFeaturedReview.comment && 
    newFeaturedReview.rating &&
    newFeaturedReview.profileImage &&
    newFeaturedReview.currentRole &&
    newFeaturedReview.currentCompany &&
    newFeaturedReview.pastRole &&
    newFeaturedReview.pastCompany &&
    newFeaturedReview.linkedin;

  return (
    <Container
      id="reviews"
      icon={Star}
      title="Course Reviews"
      description="Manage student reviews and featured testimonials"
    >
      <div className="w-full space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'reviews'
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Reviews ({state.reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('featured')}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'featured'
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Featured Reviews ({state.featuredReviews?.length || 0})
          </button>
        </div>

        {/* Regular Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Add Review Form */}
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800">
                  {editingReview !== null ? 'Edit Review' : 'Add New Review'}
                </h3>
                {editingReview !== null && (
                  <button
                    type="button"
                    onClick={cancelEditReview}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Reviewer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Student's name"
                    value={newReview.name || ''}
                    onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Avatar URL <span className="text-gray-400">(Optional - for display only)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={reviewAvatar}
                    onChange={(e) => setReviewAvatar(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Rating <span className="text-red-500">*</span>
                </label>
                {renderStars(newReview.rating || 5, true, (rating) => 
                  setNewReview(prev => ({ ...prev, rating }))
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Review Comment <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Student's review about the course"
                  value={newReview.comment || ''}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddReview}
                disabled={!isReviewFormValid}
                className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {editingReview !== null ? 'Update Review' : 'Add Review'}
              </button>
            </div>

            {/* Reviews List */}
            {state.reviews.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Course Reviews</h3>
                <div className="space-y-4">
                  {state.reviews.map((review, index) => (
                    <div key={review._id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="size-6 text-gray-500" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-800">{review.name}</h4>
                              {renderStars(review.rating)}
                              <span className="text-sm text-gray-500">
                                {new Date(review.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            type="button"
                            onClick={() => handleEditReview(index)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            <Edit className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeReview(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Featured Reviews Tab */}
        {activeTab === 'featured' && (
          <div className="space-y-6">
            {/* Add Featured Review Form */}
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800">
                  {editingFeaturedReview !== null ? 'Edit Featured Review' : 'Add Featured Review'}
                </h3>
                {editingFeaturedReview !== null && (
                  <button
                    type="button"
                    onClick={cancelEditFeaturedReview}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Reviewer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Reviewer's name"
                    value={newFeaturedReview.name || ''}
                    onChange={(e) => setNewFeaturedReview(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Current Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Current job title or role"
                    value={newFeaturedReview.currentRole || ''}
                    onChange={(e) => setNewFeaturedReview(prev => ({ ...prev, currentRole: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Current Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Current company name"
                    value={newFeaturedReview.currentCompany || ''}
                    onChange={(e) => setNewFeaturedReview(prev => ({ ...prev, currentCompany: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Past Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Previous job title or role"
                    value={newFeaturedReview.pastRole || ''}
                    onChange={(e) => setNewFeaturedReview(prev => ({ ...prev, pastRole: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Past Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Previous company name"
                    value={newFeaturedReview.pastCompany || ''}
                    onChange={(e) => setNewFeaturedReview(prev => ({ ...prev, pastCompany: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Profile Image URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/profile.jpg"
                    value={newFeaturedReview.profileImage || ''}
                    onChange={(e) => setNewFeaturedReview(prev => ({ ...prev, profileImage: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    LinkedIn URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={newFeaturedReview.linkedin || ''}
                    onChange={(e) => setNewFeaturedReview(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Rating <span className="text-red-500">*</span>
                </label>
                {renderStars(newFeaturedReview.rating || 5, true, (rating) => 
                  setNewFeaturedReview(prev => ({ ...prev, rating }))
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Review Comment <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Featured testimonial about the course"
                  value={newFeaturedReview.comment || ''}
                  onChange={(e) => setNewFeaturedReview(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddFeaturedReview}
                disabled={!isFeaturedReviewFormValid}
                className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {editingFeaturedReview !== null ? 'Update Featured Review' : 'Add Featured Review'}
              </button>
            </div>

            {/* Featured Reviews List */}
            {state.featuredReviews?.length && state.featuredReviews.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Featured Reviews</h3>
                <div className="space-y-4">
                  {state.featuredReviews?.map((review, index) => (
                    <div key={review._id} className="bg-white border border-gray-200 rounded-lg p-6 relative">
                      <div className="absolute top-4 right-4">
                        <div className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                          Featured
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 flex-1 pr-16">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="size-6 text-gray-500" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-800">{review.name}</h4>
                              {renderStars(review.rating)}
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 absolute top-12 right-4">
                          <button
                            type="button"
                            onClick={() => handleEditFeaturedReview(index)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            <Edit className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFeaturedReview(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export default ReviewsSection; 