"use client";

import React, { useState, useMemo } from "react";
import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Course } from "@/types/course";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Users,
  Star,
  CheckCircle,
  Grid,
  List,
  Upload,
  Download,
} from "lucide-react";

// Mock data for demo purposes
const mockCourses: Course[] = [
  {
    _id: "1121212121",
    title: "Complete Web Development Bootcamp",
    description:
      "Learn full-stack web development from scratch with React, Node.js, and MongoDB",
    shortDescription: "Full-stack web development course",
    category: "Technology",
    subcategory: "Web Development",
    thumbnail:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
    previewVideoUrl: "",
    isFeatured: true,
    isCertified: true,
    enrolledCount: 1250,
    totalRatings: 340,
    whatYouWillLearn:
      "Build modern web applications with the latest technologies",
    skills: ["React", "Node.js", "MongoDB", "JavaScript", "Express"],
    highlights: [],
    features: ["Lifetime Access", "Certificate", "Community Support"],
    careerPaths: [
      "Full Stack Developer",
      "Frontend Developer",
      "Backend Developer",
    ],
    skillLevel: "Beginner",
    whoShouldJoin: "Anyone interested in web development",
    prerequisites: [],
    fakeDiscount: 20,
    duration: "6 months",
    modules: ["module1", "module2", "module3"],
    instructor: ["instructor1"],
    plans: {
      essential: {
        title: "Essential Plan",
        type: "essential",
        price: 1299,
        features: [],
        isActive: true,
        billingPeriod: "monthly",
      },
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    createdBy: "admin1",
    tags: ["web", "development", "javascript"],
    audience: "college-students",
    slug: "complete-web-development-bootcamp",
    metaTitle: "Complete Web Development Bootcamp",
    metaDescription: "Learn full-stack web development",
    keywords: ["web development", "react", "node.js"],
    scholarship: true,
    scholarshipDescription: "Merit-based scholarship available",
    language: "English",
  },
  {
    _id: "2",
    title: "Data Science with Python",
    description:
      "Master data science and machine learning with Python, Pandas, and Scikit-learn",
    shortDescription: "Python data science course",
    category: "Technology",
    subcategory: "Data Science",
    thumbnail:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
    previewVideoUrl: "",
    isFeatured: false,
    isCertified: true,
    enrolledCount: 850,
    totalRatings: 220,
    whatYouWillLearn: "Data analysis, visualization, and machine learning",
    skills: ["Python", "Pandas", "NumPy", "Scikit-learn", "Matplotlib"],
    highlights: [],
    features: ["Projects", "Mentorship", "Job Support"],
    careerPaths: ["Data Scientist", "ML Engineer", "Data Analyst"],
    skillLevel: "Intermediate",
    whoShouldJoin: "Professionals with basic programming knowledge",
    prerequisites: ["Basic Python"],
    fakeDiscount: 15,
    duration: "4 months",
    modules: ["module1", "module2"],
    instructor: ["instructor2"],
    plans: {
      essential: {
        title: "Essential Plan",
        type: "essential",
        price: 1599,
        features: [],
        isActive: true,
        billingPeriod: "monthly",
      },
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-05"),
    createdBy: "admin1",
    tags: ["data science", "python", "machine learning"],
    audience: "professionals",
    slug: "data-science-with-python",
    metaTitle: "Data Science with Python",
    metaDescription: "Master data science and ML",
    keywords: ["data science", "python", "machine learning"],
    scholarship: false,
    scholarshipDescription: "",
    language: "English",
  },
  {
    _id: "3",
    title: "Digital Marketing Masterclass",
    description:
      "Complete guide to digital marketing strategies, SEO, and social media marketing",
    shortDescription: "Digital marketing course",
    category: "Business",
    subcategory: "Marketing",
    thumbnail:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
    previewVideoUrl: "",
    isFeatured: true,
    isCertified: false,
    enrolledCount: 650,
    totalRatings: 180,
    whatYouWillLearn: "Digital marketing strategies and tools",
    skills: [
      "SEO",
      "Social Media",
      "Google Ads",
      "Analytics",
      "Content Marketing",
    ],
    highlights: [],
    features: ["Case Studies", "Templates", "Tools Access"],
    careerPaths: ["Digital Marketer", "Social Media Manager", "SEO Specialist"],
    skillLevel: "Beginner",
    whoShouldJoin: "Business owners and marketers",
    prerequisites: [],
    fakeDiscount: 25,
    duration: "3 months",
    modules: ["module1"],
    instructor: ["instructor3"],
    plans: {
      essential: {
        title: "Essential Plan",
        type: "essential",
        price: 899,
        features: [],
        isActive: true,
        billingPeriod: "monthly",
      },
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: false,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-15"),
    createdBy: "admin2",
    tags: ["marketing", "digital", "seo"],
    audience: "professionals",
    slug: "digital-marketing-masterclass",
    metaTitle: "Digital Marketing Masterclass",
    metaDescription: "Complete digital marketing guide",
    keywords: ["digital marketing", "seo", "social media"],
    scholarship: false,
    scholarshipDescription: "",
    language: "English",
  },
];

const ManageCoursesPage = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // Stats calculations
  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const activeCourses = courses.filter((course) => course.isActive).length;
    const totalEnrollments = courses.reduce(
      (sum, course) => sum + course.enrolledCount,
      0
    );
    const averageRating =
      courses.length > 0
        ? courses.reduce((sum, course) => sum + (course.totalRatings || 0), 0) /
          courses.length
        : 0;

    return {
      totalCourses,
      activeCourses,
      totalEnrollments,
      averageRating: averageRating.toFixed(1),
    };
  }, [courses]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && course.isActive) ||
        (selectedStatus === "inactive" && !course.isActive) ||
        (selectedStatus === "featured" && course.isFeatured) ||
        (selectedStatus === "certified" && course.isCertified);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [courses, searchTerm, selectedCategory, selectedStatus]);

  // Unique categories for filter
  const categories = useMemo(() => {
    const cats = Array.from(new Set(courses.map((course) => course.category)));
    return cats.sort();
  }, [courses]);

  // Handlers
  const handleCreateCourse = () => {
    router.push("/admin/courses/manage-courses/create");
  };

  const handleEditCourse = (courseId: string) => {
    router.push(`/admin/courses/manage-courses/edit/${courseId}`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this course? This action cannot be undone."
      )
    ) {
      try {
        setCourses((prev) => prev.filter((course) => course._id !== courseId));
      } catch (error) {
        console.error("Failed to delete course:", error);
      }
    }
  };

  const handleViewCourse = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const handleBulkAction = (action: string) => {
    if (selectedCourses.length === 0) {
      alert("Please select courses first");
      return;
    }

    switch (action) {
      case "delete":
        if (confirm(`Delete ${selectedCourses.length} selected courses?`)) {
          setCourses((prev) =>
            prev.filter((course) => !selectedCourses.includes(course._id!))
          );
          setSelectedCourses([]);
        }
        break;
      case "activate":
        setCourses((prev) =>
          prev.map((course) =>
            selectedCourses.includes(course._id!)
              ? { ...course, isActive: true }
              : course
          )
        );
        setSelectedCourses([]);
        break;
      case "deactivate":
        setCourses((prev) =>
          prev.map((course) =>
            selectedCourses.includes(course._id!)
              ? { ...course, isActive: false }
              : course
          )
        );
        setSelectedCourses([]);
        break;
    }
  };

  const handleSelectAll = () => {
    if (selectedCourses.length === filteredCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(filteredCourses.map((course) => course._id!));
    }
  };

  const formatPrice = (course: Course) => {
    const price = course.plans?.essential?.price || course.plans?.elite?.price;
    return price ? `$${price}` : "Free";
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <FlexBox className="w-full h-full flex-col gap-6 px-8">
      {/* Header */}
      <Container
        title="Manage Courses"
        icon={BookOpen}
        className="rounded-t-none flex-shrink-0"
      >
        <div className="flex items-center gap-4">
          <OrangeButton
            onClick={handleCreateCourse}
            className="flex items-center gap-2 m-2"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </OrangeButton>
        </div>
      </Container>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="featured">Featured</option>
          <option value="certified">Certified</option>
        </select>

        {/* View Mode */}
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 ${
              viewMode === "grid"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 border-l border-gray-300 ${
              viewMode === "list"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCourses.length > 0 && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-orange-800">
              {selectedCourses.length} course(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("activate")}
                className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction("deactivate")}
                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ||
              selectedCategory !== "all" ||
              selectedStatus !== "all"
                ? "Try adjusting your filters or search terms"
                : "Get started by creating your first course"}
            </p>
            <OrangeButton
              onClick={handleCreateCourse}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </OrangeButton>
          </div>
        ) : viewMode === "grid" ? (
          <div className="p-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={selectedCourses.length === filteredCourses.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
              />
              <label className="ml-2 text-sm text-gray-600">Select all</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course._id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />

                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course._id!)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCourses((prev) => [
                              ...prev,
                              course._id!,
                            ]);
                          } else {
                            setSelectedCourses((prev) =>
                              prev.filter((id) => id !== course._id)
                            );
                          }
                        }}
                        className="w-4 h-4 text-orange-600 bg-white border-gray-300 rounded focus:ring-orange-500"
                      />
                    </div>

                    {/* Status badges */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {course.isFeatured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Featured
                        </span>
                      )}
                      {course.isCertified && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Certified
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          course.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {course.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {course.shortDescription}
                    </p>

                    {/* <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.enrolledCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {course.totalRatings}
                      </span>
                      <span className="font-semibold text-orange-600">
                        {formatPrice(course)}
                      </span>
                    </div> */}

                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        onClick={() => handleViewCourse(course._id!)}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditCourse(course._id!)}
                        className="flex-1 px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course._id!)}
                        className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedCourses.length === filteredCourses.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course._id!)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCourses((prev) => [
                              ...prev,
                              course._id!,
                            ]);
                          } else {
                            setSelectedCourses((prev) =>
                              prev.filter((id) => id !== course._id)
                            );
                          }
                        }}
                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-12 h-12 rounded-lg object-cover mr-4"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {course.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {course.shortDescription}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.enrolledCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(course)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            course.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {course.isActive ? "Active" : "Inactive"}
                        </span>
                        {course.isFeatured && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(course.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewCourse(course._id!)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Course"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditCourse(course._id!)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Edit Course"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course._id!)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FlexBox>
  );
};

export default ManageCoursesPage;
