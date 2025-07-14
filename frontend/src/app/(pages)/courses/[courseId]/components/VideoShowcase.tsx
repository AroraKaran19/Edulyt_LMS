import VideoCard from '@/app/(pages)/courses/components/VideoCard'
import { CourseModule } from '@/types'
import React from 'react'

const VideoShowcase = () => {

  const modules: CourseModule[] = [
    {
      id: "1",
      chapterNumber: 1,
      title: "Introduction to Data Science",
      description: "Get started with the fundamentals of data science and Python programming",
      thumbnail: "/CourseCardDemo.jpg",
      lessons: [
        {
          id: "1-1",
          title: "What is Data Science?",
          videoUrl: "/videos/what-is-data-science.mp4",
          materials: ["slides.pdf", "notes.md"],
          completed: false,
          isForCollegeStudent: true
        },
        {
          id: "1-2",
          title: "Setting up Python Environment",
          videoUrl: "/videos/python-setup.mp4",
          materials: ["installation-guide.pdf"],
          completed: false,
          isForCollegeStudent: true
        },
        {
          id: "1-3",
          title: "Python Basics for Data Science",
          videoUrl: "/videos/python-basics.mp4",
          materials: ["python-cheatsheet.pdf", "exercises.ipynb"],
          completed: false,
          isForCollegeStudent: true
        },
        {
          id: "1-4",
          title: "Introduction to Jupyter Notebooks",
          videoUrl: "/videos/jupyter-intro.mp4",
          materials: ["sample-notebook.ipynb"],
          completed: false,
          isForCollegeStudent: true
        },
        {
          id: "1-5",
          title: "Your First Data Analysis Project",
          videoUrl: "/videos/first-project.mp4",
          materials: ["project-template.ipynb", "sample-data.csv"],
          completed: false,
          isForCollegeStudent: false
        }
      ]
    },
    {
      id: "2",
      chapterNumber: 2,
      title: "Data Manipulation with Pandas",
      description: "Master data manipulation and analysis using the powerful Pandas library",
      thumbnail: "/CourseCardDemo.jpg",
      lessons: [
        {
          id: "2-1",
          title: "Introduction to Pandas",
          videoUrl: "/videos/pandas-intro.mp4",
          materials: ["pandas-overview.pdf"],
          completed: false,
          isForCollegeStudent: true
        },
        {
          id: "2-2",
          title: "DataFrames and Series",
          videoUrl: "/videos/dataframes-series.mp4",
          materials: ["dataframes-guide.pdf", "practice-data.csv"],
          completed: false,
          isForCollegeStudent: true
        },
        {
          id: "2-3",
          title: "Data Cleaning Techniques",
          videoUrl: "/videos/data-cleaning.mp4",
          materials: ["cleaning-checklist.pdf", "messy-data.csv"],
          completed: false,
          isForCollegeStudent: true
        },
        {
          id: "2-4",
          title: "Grouping and Aggregation",
          videoUrl: "/videos/grouping-aggregation.mp4",
          materials: ["aggregation-examples.ipynb"],
          completed: false,
          isForCollegeStudent: false
        },
        {
          id: "2-5",
          title: "Merging and Joining Data",
          videoUrl: "/videos/merging-joining.mp4",
          materials: ["merge-examples.ipynb", "dataset-a.csv", "dataset-b.csv"],
          completed: false,
          isForCollegeStudent: false
        },
        {
          id: "2-6",
          title: "Advanced Pandas Operations",
          videoUrl: "/videos/advanced-pandas.mp4",
          materials: ["advanced-techniques.ipynb"],
          completed: false,
          isForCollegeStudent: false
        }
      ]
    },
    {
      id: "3",
      chapterNumber: 3,
      title: "Data Visualization with Matplotlib & Seaborn",
      description: "Create compelling visualizations to tell stories with your data",
      thumbnail: "/CourseCardDemo.jpg",
      lessons: [
        {
          id: "3-1",
          title: "Introduction to Data Visualization",
          videoUrl: "/videos/dataviz-intro.mp4",
          materials: ["visualization-principles.pdf"],
          completed: false,
          isForCollegeStudent: true
        },
        {
          id: "3-2",
          title: "Matplotlib Fundamentals",
          videoUrl: "/videos/matplotlib-basics.mp4",
          materials: ["matplotlib-cheatsheet.pdf", "plotting-examples.ipynb"],
          completed: false,
          isForCollegeStudent: true
        },
        {
          id: "3-3",
          title: "Statistical Plots with Seaborn",
          videoUrl: "/videos/seaborn-plots.mp4",
          materials: ["seaborn-gallery.ipynb"],
          completed: false,
          isForCollegeStudent: true
        },
        {
          id: "3-4",
          title: "Interactive Visualizations",
          videoUrl: "/videos/interactive-viz.mp4",
          materials: ["plotly-examples.ipynb"],
          completed: false,
          isForCollegeStudent: false
        },
        {
          id: "3-5",
          title: "Dashboard Creation",
          videoUrl: "/videos/dashboard-creation.mp4",
          materials: ["dashboard-template.py"],
          completed: false,
          isForCollegeStudent: false
        }
      ]
    },
    {
      id: "4",
      chapterNumber: 4,
      title: "Machine Learning Fundamentals",
      description: "Dive into machine learning algorithms and build your first predictive models",
      thumbnail: "/CourseCardDemo.jpg",
      lessons: [
        {
          id: "4-1",
          title: "Introduction to Machine Learning",
          videoUrl: "/videos/ml-intro.mp4",
          materials: ["ml-overview.pdf"],
          completed: false,
          isForCollegeStudent: true
        },
        {
          id: "4-2",
          title: "Supervised vs Unsupervised Learning",
          videoUrl: "/videos/supervised-unsupervised.mp4",
          materials: ["learning-types.pdf"],
          completed: false,
          isForCollegeStudent: true
        },
        {
          id: "4-3",
          title: "Linear Regression",
          videoUrl: "/videos/linear-regression.mp4",
          materials: ["regression-notebook.ipynb", "housing-data.csv"],
          completed: false,
          isForCollegeStudent: false
        },
        {
          id: "4-4",
          title: "Classification with Logistic Regression", 
          videoUrl: "/videos/logistic-regression.mp4",
          materials: ["classification-examples.ipynb"],
          completed: false,
          isForCollegeStudent: false
        },
        {
          id: "4-5",
          title: "Decision Trees and Random Forest",
          videoUrl: "/videos/tree-algorithms.mp4",
          materials: ["tree-models.ipynb"],
          completed: false,
          isForCollegeStudent: false
        },
        {
          id: "4-6",
          title: "Model Evaluation and Validation",
          videoUrl: "/videos/model-evaluation.mp4",
          materials: ["evaluation-metrics.pdf", "validation-techniques.ipynb"],
          completed: false,
          isForCollegeStudent: false
        },
        {
          id: "4-7",
          title: "Clustering with K-Means",
          videoUrl: "/videos/kmeans-clustering.mp4",
          materials: ["clustering-examples.ipynb"],
          completed: false,
          isForCollegeStudent: false
        }
      ]
    },
    {
      id: "5",
      chapterNumber: 5,
      title: "Real-World Projects & Case Studies",
      description: "Apply your skills to real-world datasets and build a portfolio",
      thumbnail: "/CourseCardDemo.jpg",
      lessons: [
        {
          id: "5-1",
          title: "Project Planning and Data Collection",
          videoUrl: "/videos/project-planning.mp4",
          materials: ["project-template.pdf"],
          completed: false,
          isForCollegeStudent: false
        },
        {
          id: "5-2",
          title: "Customer Segmentation Analysis",
          videoUrl: "/videos/customer-segmentation.mp4",
          materials: ["customer-data.csv", "segmentation-notebook.ipynb"],
          completed: false,
          isForCollegeStudent: false
        },
        {
          id: "5-3",
          title: "Sales Forecasting Model",
          videoUrl: "/videos/sales-forecasting.mp4",
          materials: ["sales-data.csv", "forecasting-model.ipynb"],
          completed: false,
          isForCollegeStudent: false
        },
        {
          id: "5-4",
          title: "Sentiment Analysis of Social Media",
          videoUrl: "/videos/sentiment-analysis.mp4",
          materials: ["social-media-data.csv", "sentiment-notebook.ipynb"],
          completed: false,
          isForCollegeStudent: false
        },
        {
          id: "5-5",
          title: "Building Your Data Science Portfolio",
          videoUrl: "/videos/portfolio-building.mp4",
          materials: ["portfolio-guide.pdf", "github-setup.md"],
          completed: false,
          isForCollegeStudent: false
        }
      ]
    }
  ]

  return (
    <div className="video-showcase w-full flex flex-col gap-4 items-stretch">
      {modules.map((module) => (
        <VideoCard key={module.id} module={module} />
      ))}
    </div>
  )
}

export default VideoShowcase