import React from 'react'

const IndividualCoursePage = ({ params }: { params: { courseId: string } }) => {

	const courseId = params.courseId

  return (
    <div>
        <h1>Individual Course Page</h1>
        <p>Course ID: {courseId}</p>
    </div>
  )
}

export default IndividualCoursePage