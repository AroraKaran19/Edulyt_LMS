"use client";

import StoryCard from "./StoryCard";

const mockStories = [
  {
    user: {
      name: "Arjun Mehta",
      college: "National College of Engineering",
      role: "Senior Manager",
      company: "Bank of America",
    },
    title: "Mechanical Engineer to Data Analyst in 6 Months",
    content: "I was stuck in a non-tech job with limited growth. After enrolling in the program, I built 5 real-world projects and received mentorship support that helped me crack interviews. Within 6 months, I transitioned into data analytics.",
    likes: 15,
    comments: 4,
    timeAgo: "2 days ago",
  },
  {
    user: {
      name: "Arjun Mehta",
      college: "National College of Engineering",
      role: "Senior Manager",
      company: "Bank of America",
    },
    title: "Mechanical Engineer to Data Analyst in 6 Months",
    content: "I was stuck in a non-tech job with limited growth. After enrolling in the program, I built 5 real-world projects and received mentorship support that helped me crack interviews. Within 6 months, I transitioned into data analytics.",
    likes: 15,
    comments: 4,
    timeAgo: "2 days ago",
  },
  {
    user: {
      name: "Arjun Mehta",
      college: "National College of Engineering",
      role: "Senior Manager",
      company: "Bank of America",
    },
    title: "Mechanical Engineer to Data Analyst in 6 Months",
    content: "I was stuck in a non-tech job with limited growth. After enrolling in the program, I built 5 real-world projects and received mentorship support that helped me crack interviews. Within 6 months, I transitioned into data analytics.",
    likes: 15,
    comments: 4,
    timeAgo: "2 days ago",
  },
];

const CommunityFeed = () => {
  return (
    <div className="">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-extrabold text-gray-900">Read Stories</h2>
        <span className="text-sm font-bold text-[#F77124]">(200 reviews)</span>
      </div>

      <div className="flex flex-col gap-2">
        {mockStories.map((story, index) => (
          <StoryCard key={index} {...story} />
        ))}
      </div>
    </div>
  );
};

export default CommunityFeed;
