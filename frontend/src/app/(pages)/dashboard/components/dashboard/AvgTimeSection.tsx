import FlexBox from '@/components/ui/FlexBox'
import { Clock3 } from 'lucide-react'
import React from 'react'

const AvgTimeSection = () => {
  return (
    <FlexBox className="w-full h-max gap-4 border border-gray-200 rounded-lg p-5 justify-center items-center">
			<div className="icon-container h-max p-2.5 bg-[#FFEFE6] rounded-lg shrink-0 flex items-center justify-center">
				<Clock3 className="size-6 stroke-white fill-orange-500" />
			</div>
			<FlexBox className="flex-col">
				<h2 className="text-base font-medium">Average Time Spent</h2>
				<p className="text-3xl text-text-primary font-bold">
					10 minutes
				</p>
			</FlexBox>
    </FlexBox>
  )
}

export default AvgTimeSection