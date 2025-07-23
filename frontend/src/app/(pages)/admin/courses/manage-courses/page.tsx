"use client";
import FlexBox from '@/components/ui/FlexBox';
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  Calendar,
  Users,
  Star,
  DollarSign,
  BookOpen,
  Video,
  Image,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import courseService, { CourseListResponse } from '@/services/courseService';
import { cn } from '@/lib/utils';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: Array<{
    name: string;
    profileImage?: string;
  }>;
  category: string;
  skillLevel: string;
  enrolledCount: number;
  totalRatings: number;
  averageRating?: number;
  isActive: boolean;
  isFeatured: boolean;
  isCertified: boolean;
  plans: {
    elite: Array<{ price: number }>;
    essential: Array<{ price: number }>;
  };
  modules: Array<{ lessons: Array<any> }>;
  createdAt: string;
  updatedAt: string;
  slug: string;
}

const AdminCourseManageCoursesPage = () => {
  const router = useRouter();
  
  // State management
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  
  // Filter and action states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const itemsPerPage = 12;

  // Categories for filtering
  const categories = [
    'all', 'Technology', 'Business', 'Design', 'Marketing', 
    'Development', 'Data Science', 'Photography', 'Music'
  ];

  // Fetch courses
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters = [];
      if (selectedCategory !== 'all') filters.push(selectedCategory);
      if (selectedStatus === 'active') filters.push('active');
      if (selectedStatus === 'inactive') filters.push('inactive');
      if (selectedStatus === 'featured') filters.push('featured');
      
      const response = await courseService.getAllCoursesAdmin(
        currentPage,
        itemsPerPage,
        searchTerm,
        filters
      );

      if (response.success && response.data) {
        setCourses(response.data.courses);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCourses(response.data.pagination.total);
      } else {
        setError(response.message || 'Failed to fetch courses');
      }
    } catch (err) {
      setError('An error occurred while fetching courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1);
      fetchCourses();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, selectedStatus, sortBy]);

  useEffect(() => {
    fetchCourses();
  }, [currentPage]);

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (plans: Course['plans']) => {
    const elitePrice = plans.elite?.[0]?.price || 0;
    const essentialPrice = plans.essential?.[0]?.price || 0;
    const minPrice = Math.min(elitePrice, essentialPrice);
    const maxPrice = Math.max(elitePrice, essentialPrice);
    
    if (minPrice === 0 && maxPrice === 0) return 'Free';
    if (minPrice === maxPrice) return `$${minPrice}`;
    return `$${minPrice} - $${maxPrice}`;
  };

  const getTotalLessons = (modules: Course['modules']) => {
    return modules.reduce((total, module) => total + module.lessons.length, 0);
  };

  // Actions
  const handleCourseStatusToggle = async (courseId: string, currentStatus: boolean) => {
    setActionLoading(courseId);
    
    try {
      const response = await courseService.updateCourseStatus(courseId, !currentStatus);
      
      if (response.success) {
        setCourses(prev => prev.map(course => 
          course._id === courseId 
            ? { ...course, isActive: !currentStatus }
            : course
        ));
      } else {
        setError(response.message || 'Failed to update course status');
      }
    } catch (err) {
      setError('An error occurred while updating course status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCourses.length === courses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(courses.map(course => course._id));
    }
  };

  // Render functions
  const renderCourseCard = (course: Course) => (
    <div key={course._id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Course Image */}
      <div className="relative">
        <div className="aspect-video w-full bg-gray-100 rounded-t-lg overflow-hidden">
          {course.thumbnail ? (
            <img 
              src={course.thumbnail} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Image className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {course.isFeatured && (
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
              Featured
            </span>
          )}
          {course.isCertified && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">
              Certified
            </span>
          )}
        </div>

        {/* Action Menu */}
        <div className="absolute top-2 right-2">
          <div className="relative group">
            <button className="p-1 bg-white bg-opacity-90 hover:bg-opacity-100 rounded transition-all">
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-48">
              <button
                onClick={() => router.push(`/courses/${course.slug}`)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Course
              </button>
              <button
                onClick={() => router.push(`/admin/courses/manage-courses/edit/${course._id}`)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Course
              </button>
              <button
                onClick={() => handleCourseStatusToggle(course._id, course.isActive)}
                disabled={actionLoading === course._id}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading === course._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : course.isActive ? (
                  <ToggleLeft className="w-4 h-4" />
                ) : (
                  <ToggleRight className="w-4 h-4" />
                )}
                {course.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => {/* Handle delete */}}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Course
              </button>
            </div>
          </div>
        </div>

        {/* Selection Checkbox */}
        <div className="absolute bottom-2 left-2">
          <input
            type="checkbox"
            checked={selectedCourses.includes(course._id)}
            onChange={() => handleSelectCourse(course._id)}
            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Course Content */}
      <div className="p-4 space-y-3">
        {/* Title and Status */}
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {course.title}
          </h3>
                     <div className="flex items-center gap-1 ml-2 flex-shrink-0">
             {course.isActive ? (
               <CheckCircle className="w-4 h-4 text-green-500" />
             ) : (
               <Clock className="w-4 h-4 text-gray-400" />
             )}
           </div>
        </div>

        {/* Instructor */}
        {course.instructor?.[0] && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
              {course.instructor[0].profileImage ? (
                <img 
                  src={course.instructor[0].profileImage} 
                  alt={course.instructor[0].name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xs text-gray-600">
                    {course.instructor[0].name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-600 truncate">
              {course.instructor[0].name}
            </span>
          </div>
        )}

        {/* Category and Level */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-gray-100 rounded">
            {course.category}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
            {course.skillLevel}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{course.enrolledCount} students</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{getTotalLessons(course.modules)} lessons</span>
          </div>
          {course.averageRating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{course.averageRating.toFixed(1)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span>{formatPrice(course.plans)}</span>
          </div>
        </div>

        {/* Date */}
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Created {formatDate(course.createdAt)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <FlexBox className="w-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
          <p className="text-gray-600">
            {totalCourses} course{totalCourses !== 1 ? 's' : ''} total
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors",
              showFilters 
                ? "border-orange-500 bg-orange-50 text-orange-700" 
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          <button
            onClick={() => router.push('/admin/courses/manage-courses/create')}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses by title, instructor, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="featured">Featured</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                  <option value="enrollments">Most Enrolled</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedCourses.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedCourses.length === courses.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">
                {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
                Activate All
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
                Deactivate All
              </button>
              <button className="px-3 py-1 text-sm text-red-600 hover:text-red-800">
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error loading courses</p>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={fetchCourses}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="text-gray-600">Loading courses...</span>
          </div>
        </div>
      )}

      {/* Course Grid */}
      {!loading && !error && (
        <>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map(renderCourseCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first course'
                }
              </p>
              <button
                onClick={() => router.push('/admin/courses/manage-courses/create')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Course
              </button>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCourses)} of {totalCourses} courses
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "px-3 py-2 rounded-lg",
                      currentPage === pageNum
                        ? "bg-orange-500 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </FlexBox>
  );
};

export default AdminCourseManageCoursesPage;