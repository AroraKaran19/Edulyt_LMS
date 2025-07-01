export interface NavItem {
  label: string;
  href: string;
	featureBox?: string;
}

export interface CourseCardProps {
  image: string;
  title: string;
  bestSeller?: boolean;
  enrollStudents: number;
  rating: number;
  totalRating: number;
  mentors: {
    name: string;
    image: string;
  }[];
  startingPrice: number;
  className?: string;
}