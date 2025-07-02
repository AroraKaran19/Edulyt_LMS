export interface NavItem {
  label: string;
  href: string;
	featureBox?: string;
}

export interface Filter {
  label: string;
  value: string;
  featureBox?: {
    value: string;
  };
}

export interface CourseCardProps {
  image: string;
  title: string;
  bestSeller?: boolean;
  enrollStudents: string;
  rating: number;
  totalRating: number;
  mentors: {
    name: string;
    image: string;
  }[];
  startingPrice: number;
  className?: string;
  discount?: number;
  category: string;
}