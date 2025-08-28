import Image from 'next/image'
import React from 'react'

const AdminTopHeader = () => {
    return (
        <div className='flex items-center justify-between w-full bg-white py-4 px-6'>
            {/* Search Bar */}
            <div className='relative'>
                <input
                    type="text"
                    placeholder='Search'
                    className='w-80 h-10 text-[#667085] font-medium font-coolvetica rounded-md border border-[#F2F4F7] text-sm pl-4 pr-10 placeholder:text-[#667085]'
                />
                <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                    <Image src="/search-icon.svg" alt="search" width={20} height={20} />
                </div>
            </div>

            {/* User Profile Section */}
            <div className='flex items-center gap-8'>
                {/* Notifications */}
                <div className='relative'>
                    <div className='w-10 h-10 bg-white border border-[#F2F4F7] rounded-xl flex items-center justify-center cursor-pointer'>
                        <Image src="/notification-icon.svg" alt="notification" width={20} height={20} />
                    </div>
                    {/* Notification Badge */}
                    <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-lg flex items-center justify-center'>
                        <span className='text-white text-xs font-medium'>1</span>
                    </div>
                </div>

                {/* Vertical Separator */}
                <div className='w-px h-6 bg-[#EAECF0]'></div>

                {/* User Profile */}
                <div className='flex items-center gap-3 cursor-pointer'>
                    <div className='w-10 h-10 bg-[#F2ECF9] rounded-md flex items-center justify-center'>
                        <span className='text-[#492972] font-bold text-lg'>J</span>
                    </div>
                    <span className='text-[#1D2939] font-bold text-base'>John Doe</span>
                    <Image src="/down-arrow.svg" alt="down-arrow" width={20} height={20} />
                </div>
            </div>
        </div>
    )
}

export default AdminTopHeader