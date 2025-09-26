"use client";
import { FlexBox } from '@/components/ui'
import { useSession } from 'next-auth/react';
import Image from 'next/image'
import React from 'react'

const ProfilePage = () => {

  const session = useSession();
  const user = session.data?.user;
  
  return (
    <FlexBox className='w-full h-full items-center gap-6'>
      <div className="user-image-container rounded-2xl">
        <Image src={user?.image || ""} alt={user?.name || ""} width={100} height={100} />
      </div>
      <div className="user-information-container rounded-2xl"></div>
    </FlexBox>
  )
}

export default ProfilePage