"use client"
import React, { useState } from 'react'
import {  Search } from 'lucide-react'
import DropDown from '@/components/ui/dropdown/DropDown'
import Image from 'next/image'

const Analytics = () => {
  const [selectedFilter, setSelectedFilter] = useState('All Course')
  const [selectedSort, setSelectedSort] = useState('Enrollments')

  return (
    <div className="p-2 sm:p-4">
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between w-full bg-white pl-1 pr-2 sm:pr-6 pb-4 sm:pb-6 gap-2 sm:gap-0'>
        {/* Title */}
        <h1 className='text-[#1D2939] font-bold text-xl sm:text-2xl font-coolvetica'>Courses Analytics</h1>

        {/* User Profile Section */}
        <div className='flex items-center gap-4 sm:gap-8'>
          <span className='text-[#475467] font-medium font-coolvetica text-xs sm:text-sm'>Courses / Analytics</span>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Top Row - Two Cards with responsive split */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6">
          <div className="lg:col-span-6 bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EAECF0]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3 lg:gap-0">

              <div className="">
                <h3 className="text-[#667085] font-medium text-sm sm:text-base">Courses Completion Rate</h3>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2">
                  <span className="text-xl sm:text-2xl font-extrabold text-[#1D2939]">70%</span>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <div className='bg-[#F6FEF9] rounded-md p-[6px] flex items-center gap-1'>
                      <Image src="/increment-icon.svg" alt="up-arrow" width={16} height={16} className="sm:w-5 sm:h-5" />
                      <span className='text-[#12B669]'>2.12%</span>
                    </div>
                    <span className='text-[#475467]'>than last year</span>
                  </div>
                </div>
              </div>

              {/* dropdown and search bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <DropDown
                  options={['All Course', 'In Progress', 'Completed']}
                  defaultValue={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="w-full sm:w-32"
                />
                <div className='relative'>
                  <input
                    type="text"
                    placeholder='Search for course here'
                    className='w-full sm:w-80 h-10 text-[#667085] font-medium font-coolvetica rounded-xl border border-[#D0D5DD] text-sm px-4 py-6 placeholder:text-[#00000033]'
                  />
                  <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#00000033]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="flex-1 bg-[#4323F7] h-5 sm:h-7 rounded-lg"></div>
                <div className="flex-1 bg-[#F5742C] h-5 sm:h-7 rounded-lg"></div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#4323F7] rounded-full"></div>
                <span className="text-sm text-[#232A3A] font-medium">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#F5742C] rounded-full"></div>
                <span className="text-sm text-[#232A3A] font-medium">Not Completed</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EAECF0]">
            <div className="flex items-center justify-between">
              <h3 className="text-[#667085] font-medium text-sm sm:text-base">Average time for completion</h3>
              <Image src="/clock-icon.svg" alt="clock" width={28} height={28} className="sm:w-9 sm:h-9" />
            </div>

            <div className="mb-3 sm:mb-4">
              <span className="text-xl sm:text-2xl font-extrabold text-[#1D2939]">4hr 5min</span>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              <div className="text-left bg-[#1D29390F] border border-[#00000005] rounded-lg px-2 py-1">
                <div className="text-xs sm:text-sm font-medium text-[#667085]">Total Courses</div>
                <div className="text-lg sm:text-2xl font-extrabold text-[#1D2939]">100</div>
              </div>
              <div className="text-left bg-[#1D29390F] border border-[#00000005] rounded-lg px-2 py-1">
                <div className="text-xs sm:text-sm font-medium text-[#667085]">Total Bought</div>
                <div className="text-lg sm:text-2xl font-extrabold text-[#1D2939]">100</div>
              </div>
              <div className="text-left bg-[#1D29390F] border border-[#00000005] rounded-lg px-2 py-1">
                <div className="text-xs sm:text-sm font-medium text-[#667085]">Total Authors</div>
                <div className="text-lg sm:text-2xl font-extrabold text-[#1D2939]">100</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Popular Courses */}
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EAECF0] h-full min-h-[280px] sm:min-h-[320px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 sm:gap-0">
            <h3 className="text-[#667085] font-medium text-sm">Most Popular Courses</h3>
            <DropDown
              options={['Enrollments', 'Revenue', 'Rating']}
              defaultValue={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full sm:w-40"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics