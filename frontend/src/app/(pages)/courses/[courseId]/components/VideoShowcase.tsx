import VideoCard from '@/app/(pages)/courses/components/VideoCard'
import { Course } from '@/types'
import React from 'react'

const VideoShowcase = ({ course }: { course: Course }) => {

  return (
    <div className="video-showcase w-full flex flex-col gap-4 items-stretch">
      {course?.modules.length > 0 && course?.modules.map((module, index) => (
        <VideoCard key={index} module={module} index={index} />
      ))}
    </div>
  )
}

export default VideoShowcase