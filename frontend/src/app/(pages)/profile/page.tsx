"use client";
import { FlexBox, OrangeButton } from '@/components/ui'
import { useSession } from 'next-auth/react';
import Image from 'next/image'
import React from 'react'
import Link from 'next/link'
import { Settings, User as UserIcon } from 'lucide-react'

const ProfilePage = () => {

  const session = useSession();
  const user = session.data?.user;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <UserIcon className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          </div>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <FlexBox className='w-full items-center gap-8'>
            <div className="user-image-container">
              <Image 
                src={user?.image || "/user.svg"} 
                alt={user?.name || "User"} 
                width={120} 
                height={120}
                className="rounded-full border-4 border-orange-100"
              />
            </div>
            <div className="user-information-container flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {user?.name || 'User Name'}
              </h2>
              <p className="text-gray-600 mb-4">
                {user?.email || 'user@example.com'}
              </p>
              <div className="flex gap-4">
                <Link href="/profile/settings">
                  <OrangeButton className="flex items-center gap-2 px-6 py-3">
                    <Settings className="w-4 h-4" />
                    Edit Profile
                  </OrangeButton>
                </Link>
              </div>
            </div>
          </FlexBox>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage