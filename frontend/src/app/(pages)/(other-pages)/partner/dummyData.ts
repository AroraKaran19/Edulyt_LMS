/** Partner panel — static dummy data for UI only (replace with API later). */

export const collegePartnerDashboardJson = {
  stats: [
    {
      key: "students",
      label: "Total Students Enrolled",
      value: "200",
      delta: "+230 This Month",
    },
    {
      key: "courses",
      label: "Courses Offered",
      value: "56",
      delta: "+10 This Month",
    },
    {
      key: "internships",
      label: "Active Internships",
      value: "20",
      delta: "+2 This Month",
    },
    {
      key: "enrollments",
      label: "Course Enrollments",
      value: "180",
      delta: "+30 This Month",
    },
  ],
  enrollmentLineMonthly: [
    { month: "Jan", totalStudents: 45, enrolledInCourses: 30 },
    { month: "Feb", totalStudents: 62, enrolledInCourses: 48 },
    { month: "Mar", totalStudents: 78, enrolledInCourses: 55 },
    { month: "Apr", totalStudents: 92, enrolledInCourses: 70 },
    { month: "May", totalStudents: 100, enrolledInCourses: 88 },
    { month: "Jun", totalStudents: 120, enrolledInCourses: 105 },
  ],
  topCoursesDonut: [
    { name: "Python", percent: 40, color: "#F77124" },
    { name: "Data analytics", percent: 30, color: "#F7C948" },
    { name: "UI/UX design", percent: 15, color: "#12B669" },
    { name: "React", percent: 10, color: "#111827" },
    { name: "Others", percent: 5, color: "#A16207" },
  ],
  coursesTable: [
    {
      programName: "Website Development",
      type: "Course + Internship",
      students: 87,
      state: "Active",
    },
    {
      programName: "Data Science Basics",
      type: "Course",
      students: 54,
      state: "Active",
    },
    {
      programName: "UI/UX Fundamentals",
      type: "Course",
      students: 32,
      state: "Closed",
    },
    {
      programName: "Website Development",
      type: "Course + Internship",
      students: 87,
      state: "Active",
    },
    {
      programName: "Website Development",
      type: "Course + Internship",
      students: 87,
      state: "Closed",
    },
  ],
};

export const institutePartnerDashboardJson = {
  stats: [
    {
      key: "students",
      label: "Total Students Enrolled",
      value: "200",
      delta: "+230 This Month",
    },
    {
      key: "courses",
      label: "Courses Offered",
      value: "56",
      delta: "+10 This Month",
    },
    {
      key: "discount",
      label: "Courses On Discount",
      value: "12",
      delta: "+2 This Month",
    },
    {
      key: "revenue",
      label: "Total Revenue / Profit",
      value: "20K",
      delta: "+10% This Month",
    },
  ],
  enrollmentLineMonthly: [
    { month: "Jan", totalStudents: 50, enrolledInCourses: 35 },
    { month: "Feb", totalStudents: 70, enrolledInCourses: 52 },
    { month: "Mar", totalStudents: 90, enrolledInCourses: 68 },
    { month: "Apr", totalStudents: 110, enrolledInCourses: 82 },
    { month: "May", totalStudents: 135, enrolledInCourses: 95 },
    { month: "Jun", totalStudents: 160, enrolledInCourses: 120 },
  ],
  revenueBarMonthly: [
    { month: "Jan", revenue: 12000, profit: 4000 },
    { month: "Feb", revenue: 14000, profit: 5200 },
    { month: "Mar", revenue: 16000, profit: 6000 },
    { month: "Apr", revenue: 18000, profit: 7000 },
    { month: "May", revenue: 22000, profit: 8500 },
    { month: "Jun", revenue: 24000, profit: 9000 },
  ],
  coursesTable: [
    {
      programName: "Website Development",
      discount: "30 %",
      students: 87,
      state: "Active",
    },
    {
      programName: "Website Development",
      discount: "30 %",
      students: 87,
      state: "Closed",
    },
    {
      programName: "Website Development",
      discount: "30 %",
      students: 87,
      state: "Active",
    },
  ],
};

export const institutePartnerCoursesJson = {
  stats: [
    { key: "totalCourses", label: "Total Courses", value: "56", delta: "+10 This Month" },
    {
      key: "totalEnrollments",
      label: "Total Enrollments",
      value: "200",
      delta: "+230 This Month",
    },
    {
      key: "discountCourses",
      label: "Courses On Discount",
      value: "12",
      delta: "+2 This Month",
    },
    {
      key: "revenue",
      label: "Total Revenue / Profit",
      value: "20K",
      delta: "+10% This Month",
    },
  ],
  popularCourses: [
    {
      programName: "Website Development",
      category: "Programming",
      studentsEnrolled: 87,
      duration: "8 weeks",
    },
    {
      programName: "Website Development",
      category: "Programming",
      studentsEnrolled: 87,
      duration: "8 weeks",
    },
    {
      programName: "Website Development",
      category: "Programming",
      studentsEnrolled: 87,
      duration: "8 weeks",
    },
    {
      programName: "Website Development",
      category: "Programming",
      studentsEnrolled: 87,
      duration: "8 weeks",
    },
    {
      programName: "Data Science",
      category: "Data Analytics",
      studentsEnrolled: 50,
      duration: "6 weeks",
    },
    {
      programName: "Data Science",
      category: "Data Analytics",
      studentsEnrolled: 50,
      duration: "6 weeks",
    },
    {
      programName: "Data Science",
      category: "Data Analytics",
      studentsEnrolled: 50,
      duration: "6 weeks",
    },
  ],
};

export const institutePartnerStudentsJson = {
  stats: [
    { key: "totalStudents", label: "Total Students", value: "200", delta: "+230 This Month" },
    { key: "activeStudents", label: "Active Students", value: "180", delta: "+10 This Month" },
    {
      key: "courseEnrollments",
      label: "Course Enrollments",
      value: "22",
      delta: "+2 This Month",
    },
    {
      key: "completedCourses",
      label: "Completed Courses",
      value: "10",
      delta: "+30 This Month",
    },
  ],
  enrolledStudents: [
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
  ],
};

export const collegePartnerCoursesJson = {
  stats: [
    { key: "totalCourses", label: "Total Courses", value: "56", delta: "+10 This Month" },
    {
      key: "totalEnrollments",
      label: "Total Enrollments",
      value: "200",
      delta: "+230 This Month",
    },
    {
      key: "activeCourses",
      label: "Active Courses",
      value: "32",
      delta: "+2 This Month",
    },
    {
      key: "newEnrollments",
      label: "New Enrollments",
      value: "50",
      delta: "+30 This Month",
    },
  ],
  popularCourses: [
    {
      programName: "Website Development",
      category: "Programming",
      studentsEnrolled: 87,
      duration: "8 weeks",
    },
    {
      programName: "Website Development",
      category: "Programming",
      studentsEnrolled: 87,
      duration: "8 weeks",
    },
    {
      programName: "Website Development",
      category: "Programming",
      studentsEnrolled: 87,
      duration: "8 weeks",
    },
    {
      programName: "Website Development",
      category: "Programming",
      studentsEnrolled: 87,
      duration: "8 weeks",
    },
    {
      programName: "Data Science",
      category: "Data Analytics",
      studentsEnrolled: 50,
      duration: "6 weeks",
    },
    {
      programName: "Data Science",
      category: "Data Analytics",
      studentsEnrolled: 50,
      duration: "6 weeks",
    },
    {
      programName: "Data Science",
      category: "Data Analytics",
      studentsEnrolled: 50,
      duration: "6 weeks",
    },
  ],
};

export const collegePartnerInternshipsJson = {
  stats: [
    {
      key: "totalInternships",
      label: "Total Internships",
      value: "36",
      delta: "+10 This Month",
    },
    {
      key: "totalEnrollments",
      label: "Total Enrollments",
      value: "200",
      delta: "+230 This Month",
    },
    {
      key: "activeInternships",
      label: "Active Internships",
      value: "22",
      delta: "+2 This Month",
    },
    {
      key: "studentsPlaced",
      label: "Students Placed",
      value: "40",
      delta: "+30 This Month",
    },
  ],
  popularInternships: [
    {
      internshipTitle: "Website Development",
      company: "Growth labs Ltd",
      applicants: 87,
      duration: "3 Months",
    },
    {
      internshipTitle: "Website Development",
      company: "Growth labs Ltd",
      applicants: 87,
      duration: "3 Months",
    },
    {
      internshipTitle: "Website Development",
      company: "Growth labs Ltd",
      applicants: 87,
      duration: "3 Months",
    },
    {
      internshipTitle: "Website Development",
      company: "Growth labs Ltd",
      applicants: 87,
      duration: "3 Months",
    },
    {
      internshipTitle: "Website Development",
      company: "Growth labs Ltd",
      applicants: 87,
      duration: "3 Months",
    },
    {
      internshipTitle: "Website Development",
      company: "Growth labs Ltd",
      applicants: 87,
      duration: "3 Months",
    },
    {
      internshipTitle: "Website Development",
      company: "Growth labs Ltd",
      applicants: 87,
      duration: "3 Months",
    },
  ],
};

export const collegePartnerStudentsJson = {
  stats: [
    { key: "totalStudents", label: "Total Students", value: "200", delta: "+230 This Month" },
    { key: "activeStudents", label: "Active Students", value: "180", delta: "+10 This Month" },
    {
      key: "courseEnrollments",
      label: "Course Enrollments",
      value: "22",
      delta: "+2 This Month",
    },
    {
      key: "internshipParticipants",
      label: "Internship Participants",
      value: "40",
      delta: "+30 This Month",
    },
  ],
  enrolledStudents: [
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
    {
      studentName: "Rahul Sharma",
      email: "rahul123@gmail.com",
      programName: "Website Design",
      enrollmentDate: "10 march 2026",
      status: "In progress",
    },
  ],
};
