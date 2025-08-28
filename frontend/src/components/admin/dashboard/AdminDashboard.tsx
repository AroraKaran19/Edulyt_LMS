"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import DropDown from '@/components/ui/dropdown/DropDown'
import AllUsersGraph from './AllUsersGraph'
import NewSignpUsers from './NewSignupusersGraph'

const AdminDashboard = () => {
    const [selectedFilter, setSelectedFilter] = useState('Yearly')
    return (
        <div className="p-2 sm:px-4 sm:pb-2 flex flex-col gap-4">
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between w-full bg-white pr-2 sm:pr-6 gap-2 sm:gap-0'>
                {/* Title */}
                <h1 className='text-[#1D2939] font-bold text-xl sm:text-2xl font-coolvetica'>User Analytics</h1>

                {/* User Profile Section */}
                <div className='flex items-center gap-4 sm:gap-8'>
                    <span className='text-[#475467] font-medium font-coolvetica text-xs sm:text-sm'>Dashboard</span>
                </div>
            </div>

            {/* analytics banner */}
            <div className="space-y-4 sm:space-y-6 sm:pr-6">
                {/* Top Row - Two Cards with responsive split */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6">
                    <div className="lg:col-span-5 bg-white rounded-xl p-3 shadow-sm border border-[#EAECF0]">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-0">
                            <div className="">
                                <h3 className="text-[#475467] font-medium text-sm sm:text-base">Total Users</h3>
                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2">
                                    <span className="text-xl sm:text-3xl font-extrabold text-[#1D2939]">70%</span>
                                    <div className="flex items-center gap-1 text-xs font-medium">
                                        <div className='bg-[#F6FEF9] rounded-md p-[6px] flex items-center gap-1'>
                                            <Image src="/increment-icon.svg" alt="up-arrow" width={16} height={16} className="sm:w-5 sm:h-5" />
                                            <span className='text-[#12B669]'>2.12%</span>
                                        </div>
                                        <span className='text-[#475467]'>than last year</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Image src="/total-users-icon.svg" alt="total-users" width={44} height={44} className="sm:w-11 sm:h-11" />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-5 bg-white rounded-xl p-3 shadow-sm border border-[#EAECF0]">
                        <div className="">
                            <div className="flex gap-2 text-left bg-[#1D29390F] border border-[#00000005] rounded-lg px-2 py-1">

                                <div className="flex-1 bg-[#4323F7] px-2 py-1 rounded-lg justify-center items-center text-center flex flex-col gap-1">
                                    <div className="text-sm sm:text-base font-extrabold text-white">10%</div>
                                    <div className="text-xs font-medium text-[#FFFFFFCC]">Teachers</div>
                                </div>
                                <div className="flex-3 bg-[#F5742C] px-2 py-1 rounded-lg justify-center items-center text-center flex flex-col gap-1">
                                    <div className="text-sm sm:text-base font-extrabold text-white">10%</div>
                                    <div className="text-xs font-medium text-[#FFFFFFCC]">Students</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* graphs */}
            <div className="space-y-4 sm:space-y-6 sm:pr-6">
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6">

                    {/* users graph */}
                    <div className="lg:col-span-5 bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EAECF0]">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-0">
                            <div className="">
                                <h3 className="text-[#475467] font-medium text-sm sm:text-base">Active Users</h3>
                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2">
                                    <span className="text-xl sm:text-3xl font-extrabold text-[#1D2939]">1200</span>

                                </div>
                            </div>
                            <div className='cursor-pointer'>
                                <DropDown
                                    options={['Monthly', 'Yearly']}
                                    defaultValue={selectedFilter}
                                    onChange={(e) => setSelectedFilter(e.target.value)}
                                    className="w-full sm:w-28 font-bold text-base text-[#1D2939]"
                                />
                            </div>
                        </div>
                        <div>
                            <AllUsersGraph />
                        </div>
                    </div>

                    {/* new signups graph */}
                    <div className="lg:col-span-5 bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EAECF0]">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-0">
                            <div className="">
                                <h3 className="text-[#475467] font-medium text-sm sm:text-base">New Signups</h3>
                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2">
                                    <span className="text-xl sm:text-3xl font-extrabold text-[#1D2939]">24</span>
                                    <div className="flex items-center gap-1 text-xs font-medium">
                                        <div className='bg-[#F6FEF9] rounded-md p-[6px] flex items-center gap-1'>
                                            <Image src="/increment-icon.svg" alt="up-arrow" width={16} height={16} className="sm:w-5 sm:h-5" />
                                            <span className='text-[#12B669]'>2.12%</span>
                                        </div>
                                        <span className='text-[#475467]'>than last year</span>
                                    </div>
                                </div>
                            </div>
                            <div className='cursor-pointer'>
                                <DropDown
                                    options={['Monthly', 'Yearly']}
                                    defaultValue={selectedFilter}
                                    onChange={(e) => setSelectedFilter(e.target.value)}
                                    className="w-full sm:w-28 font-bold text-base text-[#1D2939]"
                                />
                            </div>
                        </div>
                        <div>
                            <NewSignpUsers />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default AdminDashboard