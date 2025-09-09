import React from 'react'
import { ArrowLeft, Download, Share2, CheckCircle, Clock, Award } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface CertificateDetailPageProps {
  params: {
    certificateId: string
  }
}

const CertificateDetailPage = ({ params }: CertificateDetailPageProps) => {
  const certificateId = params.certificateId

  // Mock certificate data - replace with actual data fetching
  const certificate = {
    id: certificateId,
    title: "Data Science: Zero to Hundred",
    completedDate: "24th March 2023",
    hoursCompleted: "20 hours",
    grade: "A",
    instructor: "Dr. Sarah Johnson",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum.",
    skills: ["Data Science", "Machine Learning", "Statistics", "Python", "Data Visualization"]
  }

  return (
    <div className="min-h-screen">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Column - Course Information */}
          <div className="space-y-2">

            {/* Completion Status */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-green-200 to-white rounded-xl p-1">
              <CheckCircle className="w-6 h-6 text-[#12B669]" />
              <span className="text-lg font-semibold text-[#12B669] font-plus-jakarta ">
                Completed on {certificate.completedDate}
              </span>
            </div>

            {/* Course Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {certificate.title}
              </h1>
            </div>

            {/* Stats Section */}
            <div className="bg-white rounded-xl p-3 border border-[#0000001F]">
              <p className="text-[#2B1508] font-bold font-plus-jakarta text-sm"> Stats</p>
              <div className="flex items-center justify-between mt-2">
                {/* timer and grades */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-[#000000] font-semibold font-plus-jakarta text-xs">{certificate.hoursCompleted}</span>
                    <span className="text-[#00000080] font-semibold font-plus-jakarta text-xs"> Completed In</span>
                  </div>
                  <div className='border border-[#00000029] h-10 mx-6'></div>
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-[#000000] font-semibold font-plus-jakarta text-xs">{certificate.grade}</span>
                    <span className="text-[#00000080] font-semibold font-plus-jakarta text-xs">Grade Achieved</span>
                  </div>
                </div>
                <button type="button" className="flex justify-center items-center gap-1 sm:gap-2 bg-white border border-[#00000021] text-[#656565] rounded-lg px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs font-bold hover:bg-gray-100 transition cursor-pointer shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"                >
                  <span className="">Go Back to course</span>
                </button>
              </div>
            </div>

            {/* About the Course */}
            <div className="bg-white rounded-xl p-6 border border-[#0000001F] mt-4">
              <h3 className="text-[#2B1508] font-bold font-plus-jakarta text-sm mb-2">About the Course</h3>
              <p className="text-[#000000] font-normal font-plus-jakarta text-sm leading-relaxed">
                {certificate.description}
              </p>
              <h3 className="text-[#2B1508] font-bold font-plus-jakarta text-sm my-2">Skills you learned</h3>
              <div className="flex flex-wrap gap-2">
                {certificate.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-[#EDEDED] text-black px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Certificate */}
          <div className="space-y-6 ">
            {/* Certificate Image */}
            <div className="bg-[#F8F8F8] rounded-md p-6 border border-[#00000017]  min-h-[460px]">
              <div className="relative w-full h-full bg-white overflow-hidden">
                {/* Certificate Design */}
                <Image src="/certificate-complete-image.png"
                  alt="certificate" width={585} height={420}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row gap-4 w-full">
              <button type="button" className="w-[172px] flex justify-center items-center gap-1 sm:gap-2 bg-white border border-[#00000021] text-[#656565] rounded-lg px-3 py-[10px] text-xs font-bold hover:bg-gray-100 transition cursor-pointer shadow-[0px_-3px_3.7px_0px_#0146E721_inset]">
                <Share2 size={20} />
                Share Certificate
              </button>
              <button type="button" className="w-[172px] flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-[10px] rounded-lg font-bold text-xs transition-colors cursor-pointer">
                Download certificate
                <Download size={20} />

              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CertificateDetailPage
