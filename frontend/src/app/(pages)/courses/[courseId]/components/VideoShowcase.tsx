import VideoCard from '@/app/(pages)/courses/components/VideoCard'
import { CourseModule } from '@/types'
import React from 'react'

const VideoShowcase = ({ modules }: { modules: CourseModule[] }) => {

  return (
    <div className="video-showcase w-full flex flex-col gap-4 items-stretch">
      {modules.length > 0 && modules.map((module, index) => (
        <VideoCard key={index} module={module} index={index} />
      ))}
    </div>
  )
}

export default VideoShowcase