import React from 'react'
import { Plus_Jakarta_Sans } from 'next/font/google'
import CoursesCarousel from './CoursesCarousel'
import { CourseCardProps } from '@/types'

const plusJakartaSans = Plus_Jakarta_Sans({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
})

const TopCoursesSection = () => {

	const topCourses: CourseCardProps[] = [
		{
			title: "Data Science: Zero to Hundred",
			image: "/CourseCardDemo.jpg",
			bestSeller: true,
			enrollStudents: 100,
			rating: 4.5,
			totalRating: 100,
			mentors: [
				{
					name: "Mentor 1",
					image: "/CourseCardDemo.jpg",
				},
				{
					name: "Mentor 2",
					image: "/CourseCardDemo.jpg",
				},
				{
					name: "Mentor 3",
					image: "/CourseCardDemo.jpg",
				},
				{
					name: "Mentor 4",
					image: "/CourseCardDemo.jpg",
				},
			],
			startingPrice: 100,
		},
		{
			title: "Data Science: Zero to Hundred",
			image: "/CourseCardDemo.jpg",
			bestSeller: true,
			enrollStudents: 100,
			rating: 4.5,
			totalRating: 100,
			mentors: [
				{
					name: "Mentor 1",
					image: "/CourseCardDemo.jpg",
				},
			],
			startingPrice: 100,	
		},
		{
			title: "Data Science: Zero to Hundred",
			image: "/CourseCardDemo.jpg",
			bestSeller: true,
			enrollStudents: 100,
			rating: 4.5,
			totalRating: 100,
			mentors: [
				{
					name: "Mentor 1",
					image: "/CourseCardDemo.jpg",
				},
			],
			startingPrice: 100,
		},
		{
			title: "Data Science: Zero to Hundred",
			image: "/CourseCardDemo.jpg",
			bestSeller: true,
			enrollStudents: 100,
			rating: 4.5,
			totalRating: 100,
			mentors: [
				{
					name: "Mentor 1",
					image: "/CourseCardDemo.jpg",
				},
			],
			startingPrice: 100,
		},
	]


  return (
    <div className={`top-courses-section w-full bg-white rounded-2xl py-10 flex flex-col items-center ${plusJakartaSans.className}`}>
			<h1 className="text-lg font-normal text-[#2B1508]">Courses</h1>
			<h2 className="text-[44px] mt-3 text-[#2B1508] font-coolvetica leading-tight text-center text-wrap-balance">
				Our Best <span className="text-[#f77124]">Courses</span> <br />
				you can Enroll now!
			</h2>
			<div className="top-courses-carousel w-full mt-10">
				<CoursesCarousel courses={topCourses} />
			</div>
		</div>
  )
}

export default TopCoursesSection