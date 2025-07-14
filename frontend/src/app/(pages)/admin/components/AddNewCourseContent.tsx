"use client";

import React, { useState } from 'react';
import OrangeButton from "@/components/ui/OrangeButton";
import WhiteButton from "@/components/ui/WhiteButton";
import BasicInformationSection from "./BasicInformationSection";
import CourseDetailsSection from "./CourseDetailsSection";
import MediaSection from "./MediaSection";
import PricingPlansSection from "./PricingPlansSection";
import LearningOutcomesSection from "./LearningOutcomesSection";
import CourseFeaturesSection from "./CourseFeaturesSection";
import SeoSettingsSection from "./SeoSettingsSection";
import CourseModulesSection from "./CourseModulesSection";
import SettingsSection from "./SettingsSection";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { CourseModule } from '@/types';
import { AxiosError } from 'axios';

// Interface for the complete course form data
interface CourseFormData {
  // Basic Information
  basicInfo: {
    courseTitle: string;
    subtitle: string;
    courseDescription: string;
    shortDescription: string;
  };
  
  // Course Details
  courseDetails: {
    category: string;
    subcategory: string;
    skillLevel: string;
    language: string;
    courseDuration: string;
    totalLectures: string;
  };
  
  // Media
  media: {
    courseThumbnail: File | null;
    previewImage: File | null;
    promotionalVideo: File | null;
  };
  
  // Pricing Plans
  pricing: {
    professionals: {
      elite: {
        price: number;
        features: string[];
      };
      essential: {
        price: number;
        features: string[];
      };
    };
    collegeStudents: {
      elite: {
        price: number;
        features: string[];
      };
      essential: {
        price: number;
        features: string[];
      };
    };
  };
  
  // Learning Outcomes
  learningOutcomes: {
    targetAudience: string;
    prerequisites: string;
    whatYoullLearn: string;
  };
  
  // Course Features
  courseFeatures: {
    keyFeatures: string;
    courseTags: string;
    courseDifficulty: string;
    courseFormat: {
      videoLectures: boolean;
      handsOnProjects: boolean;
      quizzes: boolean;
      assignments: boolean;
    };
    additionalFeatures: {
      certificate: boolean;
      lifetimeAccess: boolean;
      mobileAccess: boolean;
    };
  };
  
  // SEO Settings
  seoSettings: {
    courseUrlSlug: string;
    metaTitle: string;
    metaDescription: string;
    focusKeywords: string;
    secondaryKeywords: string;
  };
  
  // Course Modules (this will be handled by the CourseModulesSection)
  courseModules: CourseModule[];
  
  // Settings
  settings: {
    courseStatus: {
      activeCourse: boolean;
      featuredCourse: boolean;
      certifiedCourse: boolean;
    };
    enrollmentSettings: {
      maximumStudents: string;
      enrollmentDeadline: string;
    };
    accessControl: {
      requireApproval: boolean;
      allowPreview: boolean;
    };
    administrativeDetails: {
      courseCreator: string;
      courseVersion: string;
    };
  };
}

const AddNewCourseContent: React.FC = () => {
  // State to store course modules data
  const [courseModulesData, setCourseModulesData] = useState<CourseModule[]>([]);
  // Loading state for save as draft button
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  // Callback to receive modules data from CourseModulesSection
  const handleModulesChange = (modules: CourseModule[]) => {
    setCourseModulesData(modules);
  };

  // Save as Draft function - collects all form data from the DOM and sends to backend
  const handleSaveAsDraft = async () => {
    if (isSavingDraft) return; // Prevent multiple requests
    
    setIsSavingDraft(true);
    try {
      const form = document.querySelector('form');
      if (!form) {
        alert('Form not found. Please try again.');
        return;
      }

      // Collect form data using the same logic as before
      const collectedData: CourseFormData = {
        basicInfo: {
          courseTitle: '',
          subtitle: '',
          courseDescription: '',
          shortDescription: '',
        },
        courseDetails: {
          category: '',
          subcategory: '',
          skillLevel: '',
          language: '',
          courseDuration: '',
          totalLectures: '',
        },
        media: {
          courseThumbnail: null,
          previewImage: null,
          promotionalVideo: null,
        },
        pricing: {
          professionals: {
            elite: {
              price: 0,
              features: [],
            },
            essential: {
              price: 0,
              features: [],
            },
          },
          collegeStudents: {
            elite: {
              price: 0,
              features: [],
            },
            essential: {
              price: 0,
              features: [],
            },
          },
        },
        learningOutcomes: {
          targetAudience: '',
          prerequisites: '',
          whatYoullLearn: '',
        },
        courseFeatures: {
          keyFeatures: '',
          courseTags: '',
          courseDifficulty: '',
          courseFormat: {
            videoLectures: false,
            handsOnProjects: false,
            quizzes: false,
            assignments: false,
          },
          additionalFeatures: {
            certificate: false,
            lifetimeAccess: false,
            mobileAccess: false,
          },
        },
        seoSettings: {
          courseUrlSlug: '',
          metaTitle: '',
          metaDescription: '',
          focusKeywords: '',
          secondaryKeywords: '',
        },
        courseModules: [],
        settings: {
          courseStatus: {
            activeCourse: false,  
            featuredCourse: false,
            certifiedCourse: false,
          },
          enrollmentSettings: {
            maximumStudents: '',
            enrollmentDeadline: '',
          },
          accessControl: {
            requireApproval: false,
            allowPreview: false,
          },
          administrativeDetails: {
            courseCreator: '',
            courseVersion: '',
          },
        },
      };

      console.log('=== COURSE FORM DATA - SAVED AS DRAFT ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('');

      // Basic Information Section
      const basicInfo = {
        courseTitle: (document.querySelector('input[placeholder*="Complete Data Science Bootcamp"]') as HTMLInputElement)?.value || '',
        subtitle: (document.querySelector('input[placeholder*="Master Python, Pandas"]') as HTMLInputElement)?.value || '',
        courseDescription: (document.querySelector('textarea[placeholder*="Provide a comprehensive description"]') as HTMLTextAreaElement)?.value || '',
        shortDescription: (document.querySelector('textarea[placeholder*="A brief, compelling summary"]') as HTMLTextAreaElement)?.value || '',
      };
      collectedData.basicInfo = basicInfo;
      console.log('📚 BASIC INFORMATION:');
      console.log(basicInfo);
      console.log('');

      // Course Details Section
      const courseDetails = {
        category: (document.querySelector('#course-category') as HTMLSelectElement)?.value || '',
        subcategory: (document.querySelector('#course-subcategory') as HTMLInputElement)?.value || '',
        skillLevel: (document.querySelector('#course-skill-level') as HTMLSelectElement)?.value || '',
        language: (document.querySelector('#course-language') as HTMLSelectElement)?.value || '',
        courseDuration: (document.querySelector('#course-duration') as HTMLInputElement)?.value || '',
        totalLectures: (document.querySelector('#course-total-lectures') as HTMLInputElement)?.value || '',
      };
      collectedData.courseDetails = courseDetails;
      console.log('🎯 COURSE DETAILS:');
      console.log(courseDetails);
      console.log('');

      const media = {
        courseThumbnail: null,
        previewImage: null,
        promotionalVideo: null,
      };
      collectedData.media = media;
      console.log('🖼️ MEDIA FILES:');
      console.log(media);
      console.log('');

      // Pricing Plans Section - Updated structure
      const profElitePriceInput = document.querySelector('#professionals-elite-price') as HTMLInputElement;
      const profEliteFeaturesTextarea = document.querySelector('#professionals-elite-features') as HTMLTextAreaElement;
      const profEssentialPriceInput = document.querySelector('#professionals-essential-price') as HTMLInputElement;
      const profEssentialFeaturesTextarea = document.querySelector('#professionals-essential-features') as HTMLTextAreaElement;
      
      const collegeElitePriceInput = document.querySelector('#college-students-elite-price') as HTMLInputElement;
      const collegeEliteFeaturesTextarea = document.querySelector('#college-students-elite-features') as HTMLTextAreaElement;
      const collegeEssentialPriceInput = document.querySelector('#college-students-essential-price') as HTMLInputElement;
      const collegeEssentialFeaturesTextarea = document.querySelector('#college-students-essential-features') as HTMLTextAreaElement;
      
      const pricing = {
        professionals: {
          elite: {
            price: parseFloat(profElitePriceInput?.value) || 0,
            features: profEliteFeaturesTextarea?.value.split('\n').filter(f => f.trim()) || [],
          },
          essential: {
            price: parseFloat(profEssentialPriceInput?.value) || 0,
            features: profEssentialFeaturesTextarea?.value.split('\n').filter(f => f.trim()) || [],
          },
        },
        collegeStudents: {
          elite: {
            price: parseFloat(collegeElitePriceInput?.value) || 0,
            features: collegeEliteFeaturesTextarea?.value.split('\n').filter(f => f.trim()) || [],
          },
          essential: {
            price: parseFloat(collegeEssentialPriceInput?.value) || 0,
            features: collegeEssentialFeaturesTextarea?.value.split('\n').filter(f => f.trim()) || [],
          },
        },
      };
      collectedData.pricing = pricing;
      console.log('💰 PRICING PLANS:');
      console.log(pricing);
      console.log('');

      // Learning Outcomes Section
      const learningOutcomes = {
        targetAudience: (document.querySelector('textarea[placeholder*="Software developers wanting to transition"]') as HTMLTextAreaElement)?.value || '',
        prerequisites: (document.querySelector('textarea[placeholder*="Basic understanding of programming"]') as HTMLTextAreaElement)?.value || '',
        whatYoullLearn: '', // Will be collected when section is updated
      };
      collectedData.learningOutcomes = learningOutcomes;
      console.log('🎯 LEARNING OUTCOMES:');
      console.log(learningOutcomes);
      console.log('');

      // Course Features Section
      const keyFeaturesTextarea = document.querySelector('textarea[placeholder*="Lifetime access to course materials"]') as HTMLTextAreaElement;
      const courseTagsInput = document.querySelector('input[placeholder*="python, data-science"]') as HTMLInputElement;
      const courseDifficultySelect = document.querySelector('select[className*="course-difficulty"]') as HTMLSelectElement;
      
      const courseFormat = {
        videoLectures: (document.querySelector('#video-lectures') as HTMLInputElement)?.checked || false,
        handsOnProjects: (document.querySelector('#hands-on-projects') as HTMLInputElement)?.checked || false,
        quizzes: (document.querySelector('#quizzes') as HTMLInputElement)?.checked || false,
        assignments: (document.querySelector('#assignments') as HTMLInputElement)?.checked || false,
      };

      const additionalFeatures = {
        certificate: (document.querySelector('#certificate') as HTMLInputElement)?.checked || false,
        lifetimeAccess: (document.querySelector('#lifetime-access') as HTMLInputElement)?.checked || false,
        mobileAccess: (document.querySelector('#mobile-access') as HTMLInputElement)?.checked || false,
      };

      const courseFeatures = {
        keyFeatures: keyFeaturesTextarea?.value || '',
        courseTags: courseTagsInput?.value || '',
        courseDifficulty: courseDifficultySelect?.value || '',
        courseFormat,
        additionalFeatures,
      };
      collectedData.courseFeatures = courseFeatures;
      console.log('⭐ COURSE FEATURES:');
      console.log(courseFeatures);
      console.log('');

      // SEO Settings Section
      const seoSettings = {
        courseUrlSlug: (document.querySelector('input[placeholder="complete-data-science-bootcamp"]') as HTMLInputElement)?.value || '',
        metaTitle: (document.querySelector('input[placeholder*="Complete Data Science Bootcamp - Learn Python"]') as HTMLInputElement)?.value || '',
        metaDescription: '', // Will be collected when section is updated
        focusKeywords: (document.querySelector('input[placeholder*="data science, python programming"]') as HTMLInputElement)?.value || '',
        secondaryKeywords: (document.querySelector('input[placeholder*="data analysis, pandas"]') as HTMLInputElement)?.value || '',
      };
      collectedData.seoSettings = seoSettings;
      console.log('🔍 SEO SETTINGS:');
      console.log(seoSettings);
      console.log('');

      // Settings Section
      const settings = {
        courseStatus: {
          activeCourse: (document.querySelector('input[type="checkbox"]') as HTMLInputElement)?.checked || false,
          featuredCourse: false, // Will be collected when section is updated
          certifiedCourse: false,
        },
        enrollmentSettings: {
          maximumStudents: (document.querySelector('input[placeholder*="100"]') as HTMLInputElement)?.value || '',
          enrollmentDeadline: (document.querySelector('input[type="date"]') as HTMLInputElement)?.value || '',
        },
        accessControl: {
          requireApproval: false, // Will be collected when section is updated
          allowPreview: false,
        },
        administrativeDetails: {
          courseCreator: (document.querySelector('input[defaultValue="admin"]') as HTMLInputElement)?.value || 'admin',
          courseVersion: (document.querySelector('input[defaultValue="1.0"]') as HTMLInputElement)?.value || '1.0',
        },
      };
      collectedData.settings = settings;
      console.log('⚙️ SETTINGS:');
      console.log(settings);
      console.log('');

      // Course Modules - now properly collected from state
      collectedData.courseModules = courseModulesData;
      console.log('📖 COURSE MODULES:');
      console.log(courseModulesData);
      console.log('');

      console.log('📋 COMPLETE FORM DATA:');
      console.log(collectedData);
      console.log('=== END OF DRAFT DATA ===');

      // Prepare payload for backend
      const payload = {
        ...collectedData,
        savedAt: new Date().toISOString(),
        status: 'draft',
      };

      // Save to localStorage for persistence (backup)
      localStorage.setItem('courseFormDraft', JSON.stringify(payload));

      // Make API call to backend
      console.log('🚀 Sending data to backend...');
      const response = await apiClient.post(ENDPOINTS.admin.saveDraft, payload);

      console.log('✅ Backend Response:', response.data);
      
      // Success feedback
      alert(`✅ Course saved as draft successfully!\n\nDraft ID: ${response.data?.draftId || 'Generated'}\nTimestamp: ${new Date().toLocaleString()}\n\nCheck console for detailed data.`);

    } catch (error) {
      console.error('❌ Error saving draft:', error);
      
      // Provide detailed error feedback based on error type
      if (error instanceof AxiosError) {
        // Backend responded with error status
        const status = error.response?.status;
        const message = error.response?.data?.message || 'Unknown server error';
        alert(`❌ Failed to save draft!\n\nServer Error (${status}): ${message}\n\nData has been saved locally as backup.`);
      } else if (error instanceof Error) {
        // Request was made but no response received
        alert(`❌ Failed to save draft!\n\nNetwork Error: Could not reach the server.\nPlease check your connection.\n\nData has been saved locally as backup.`);
      } else {
        // Something else happened
        alert(`❌ Failed to save draft!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nData has been saved locally as backup.`);
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 border-b border-gray-200 bg-white" style={{ height: '84px' }}>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Add New Course
          </h2>
          <p className="text-gray-600">
            Create and publish a new course for your students
          </p>
        </div>
        <div className="flex gap-3">
          <WhiteButton 
            className="text-sm font-medium"
            onClick={handleSaveAsDraft}
            disabled={isSavingDraft}
          >
            {isSavingDraft ? 'Saving...' : 'Save as Draft'}
          </WhiteButton>
          <OrangeButton className="text-sm font-semibold">
            Publish Course
          </OrangeButton>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <form className="space-y-8">
            {/* Basic Information */}
            <BasicInformationSection />

            {/* Course Details */}
            <CourseDetailsSection />

            {/* Media */}
            <MediaSection />

            {/* Pricing Plans */}
            <PricingPlansSection />

            {/* Learning Outcomes */}
            <LearningOutcomesSection />

            {/* Course Features */}
            <CourseFeaturesSection />

            {/* SEO Settings */}
            <SeoSettingsSection />

            {/* Course Modules */}
            <div id="course-modules">
              <CourseModulesSection onModulesChange={handleModulesChange} />
            </div>

            {/* Settings */}
            <SettingsSection />
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddNewCourseContent; 