export interface StudentProfile {
  name: string;
  image?: string;
}

export interface PartnerCollege {
  _id?: string;
  name: string;
  image: string;
  website: string;

  internshipStudents: {
    count: number;
    students: StudentProfile[];
  };

  coursesEnrollment: {
    count: number;
    students: StudentProfile[];
  };
}
