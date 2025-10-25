"use client";
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Users,
  BookOpen,
  Play,
  FileText,
  HelpCircle,
  AlertCircle,
  Tag,
  Globe,
  Award,
  BarChart3,
  Zap,
} from "lucide-react";
import Container from "@/app/admin/components/ui/Container";
import { useFormContext } from "react-hook-form";
import { CourseFormData } from "@/types/courseForm";
import { useCourseFormContext } from "@/contexts/CourseFormContext";
import { useCourses } from "@/hooks/useCourses";
import { CourseModule } from "@/types/course";

const Screen12 = () => {
  const { watch } = useFormContext<CourseFormData>();
  const { isEditMode, courseId } = useCourseFormContext();
  const { getCourseByIdAdmin } = useCourses();
  
  // Watch form values
  const formData = watch();
  
  // LocalStorage key for modules
  const modulesStorageKey = `course_modules_${isEditMode ? courseId : 'new'}`;
  
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load modules from localStorage or API
  useEffect(() => {
    const loadModules = async () => {
      try {
        const stored = localStorage.getItem(modulesStorageKey);
        if (stored) {
          setModules(JSON.parse(stored));
        } else if (isEditMode && courseId) {
          // If no localStorage data in edit mode, try to fetch from API
          try {
            const response = await getCourseByIdAdmin(courseId);
            if (response.success && response.data?.modules) {
              const transformedModules = response.data.modules.map((module: any) => ({
                _id: module._id,
                title: module.title,
                description: module.description,
                thumbnailUrl: module.thumbnailUrl,
                thumbnailSource: module.thumbnailSource || "url",
                thumbnailS3Key: module.thumbnailS3Key || "",
                lessonIds: module.lessonIds || [],
                isCompleted: module.isCompleted || false,
                isActive: module.isActive !== undefined ? module.isActive : true,
                isLocked: module.isLocked || false,
                lessons: module.lessons || [],
              }));
              setModules(transformedModules);
            }
          } catch (apiError) {
            console.error("Error fetching course data:", apiError);
          }
        }
      } catch (error) {
        console.error("Error loading modules:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModules();
  }, [modulesStorageKey, isEditMode, courseId, getCourseByIdAdmin]);

  // Calculate statistics
  const totalModules = modules.length;
  const totalLessons = modules.reduce((acc, module) => acc + (module.lessons?.length || 0), 0);
  const totalContent = modules.reduce((acc, module) => 
    acc + (module.lessons?.reduce((lessonAcc, lesson) => 
      lessonAcc + (lesson.contents?.length || 0), 0) || 0), 0
  );
  
  const videoContent = modules.reduce((acc, module) => 
    acc + (module.lessons?.reduce((lessonAcc, lesson) => 
      lessonAcc + (lesson.contents?.filter(content => content.type === "video").length || 0), 0) || 0), 0
  );
  
  const documentContent = modules.reduce((acc, module) => 
    acc + (module.lessons?.reduce((lessonAcc, lesson) => 
      lessonAcc + (lesson.contents?.filter(content => content.type === "document").length || 0), 0) || 0), 0
  );
  
  const quizContent = modules.reduce((acc, module) => 
    acc + (module.lessons?.reduce((lessonAcc, lesson) => 
      lessonAcc + (lesson.contents?.filter(content => content.type === "quiz").length || 0), 0) || 0), 0
  );

  // Calculate completion percentage
  const completionSteps = [
    { name: "Basic Information", completed: !!(formData.title && formData.description && formData.category) },
    { name: "Course Media", completed: !!(formData.thumbnail || formData.previewVideoUrl) },
    { name: "Course Structure", completed: totalModules > 0 },
    { name: "Content Creation", completed: totalContent > 0 },
    { name: "Course Settings", completed: !!(formData.isActive !== undefined) },
  ];
  
  const completedSteps = completionSteps.filter(step => step.completed).length;
  const completionPercentage = (completedSteps / completionSteps.length) * 100;

  // Get course status
  const getCourseStatus = () => {
    if (completionPercentage === 100) return { status: "Ready to Publish", color: "text-green-600", bgColor: "bg-green-50" };
    if (completionPercentage >= 80) return { status: "Almost Ready", color: "text-yellow-600", bgColor: "bg-yellow-50" };
    if (completionPercentage >= 50) return { status: "In Progress", color: "text-blue-600", bgColor: "bg-blue-50" };
    return { status: "Getting Started", color: "text-gray-600", bgColor: "bg-gray-50" };
  };

  const courseStatus = getCourseStatus();

  if (isLoading) {
  return (
      <Container
        title="Course Summary"
        description="Review your course before publishing"
        className="h-full w-full"
        classNameBody="flex flex-col gap-6"
      >
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Course Summary"
      description="Review your course before publishing"
      className="h-full w-full max-h-full overflow-y-auto flex flex-col relative"
      classNameBody="flex flex-col gap-6"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Course Status Banner */}
      <div className={`${courseStatus.bgColor} rounded-lg p-4 border border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${courseStatus.bgColor} border-2 border-current ${courseStatus.color}`}>
              {completionPercentage === 100 ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <BarChart3 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${courseStatus.color}`}>
                {courseStatus.status}
              </h3>
              <p className="text-sm text-gray-600">
                {completionPercentage.toFixed(0)}% Complete ({completedSteps}/{completionSteps.length} steps)
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">{completionPercentage.toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Completion</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Completion Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {completionSteps.map((step, index) => (
          <div key={index} className={`p-4 rounded-lg border ${step.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <div>
                <h4 className={`font-medium ${step.completed ? 'text-green-800' : 'text-gray-600'}`}>
                  {step.name}
                </h4>
                <p className={`text-sm ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.completed ? 'Completed' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Course Information</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Course Title</label>
              <p className="text-gray-800 font-medium">{formData.title || "Not specified"}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Category</label>
              <div className="flex items-center gap-2 mt-1">
                <Tag className="w-4 h-4 text-gray-500" />
                <span className="text-gray-800 capitalize">{formData.category || "Not specified"}</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Target Audience</label>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-800 capitalize">{formData.audience || "Not specified"}</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Language</label>
              <div className="flex items-center gap-2 mt-1">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-gray-800">{formData.language || "Not specified"}</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Skill Level</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold text-orange-600 capitalize">
                  {formData.skillLevel || "Beginner"}
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {formData.skillLevel || "Beginner"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Course Statistics</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{totalModules}</div>
              <div className="text-sm text-gray-600">Modules</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{totalLessons}</div>
              <div className="text-sm text-gray-600">Lessons</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{totalContent}</div>
              <div className="text-sm text-gray-600">Content Items</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{formData.duration || "N/A"}</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
          </div>
          
          {/* Content Type Breakdown */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Content Breakdown</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Videos</span>
                </div>
                <span className="text-sm font-medium text-gray-800">{videoContent}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Documents</span>
                </div>
                <span className="text-sm font-medium text-gray-800">{documentContent}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Quizzes</span>
                </div>
                <span className="text-sm font-medium text-gray-800">{quizContent}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Structure Preview */}
      {totalModules > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Course Structure</h3>
          </div>
          
          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <div key={module._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-semibold text-orange-600">{moduleIndex + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{module.title}</h4>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </div>
                  <div className="ml-auto text-sm text-gray-500">
                    {module.lessons?.length || 0} lessons
                  </div>
                </div>
                
                {module.lessons && module.lessons.length > 0 && (
                  <div className="ml-6 space-y-2">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson._id} className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">{lessonIndex + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-800">{lesson.title}</h5>
                          <p className="text-xs text-gray-600">{lesson.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {lesson.contents?.map((content) => (
                            <div key={content._id} className={`w-4 h-4 rounded flex items-center justify-center ${
                              content.type === "video" ? "bg-green-100" :
                              content.type === "document" ? "bg-blue-100" : "bg-purple-100"
                            }`}>
                              {content.type === "video" ? (
                                <Play className="w-2 h-2 text-green-600" />
                              ) : content.type === "document" ? (
                                <FileText className="w-2 h-2 text-blue-600" />
                              ) : (
                                <HelpCircle className="w-2 h-2 text-purple-600" />
                              )}
                            </div>
                          ))}
                          <span>{lesson.contents?.length || 0} items</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Features */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Course Features</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${formData.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${formData.isActive ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {formData.isActive ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Active Course</h4>
                <p className="text-sm text-gray-600">{formData.isActive ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${formData.isFeatured ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${formData.isFeatured ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {formData.isFeatured ? <Award className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Featured Course</h4>
                <p className="text-sm text-gray-600">{formData.isFeatured ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${formData.isCertified ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${formData.isCertified ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {formData.isCertified ? <Award className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Certified Course</h4>
                <p className="text-sm text-gray-600">{formData.isCertified ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Screen12;