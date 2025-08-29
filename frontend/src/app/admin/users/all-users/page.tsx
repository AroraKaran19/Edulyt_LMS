import AdminTopHeader from '@/components/admin/AdminTopHeader'
import UnderDevelopment from '@/components/ui/UnderDevelopment'
import React from 'react'

const page = () => {
    return (
        <div className="w-full h-full flex-col gap-4">
            <AdminTopHeader />
            <div className="w-full text-2xl font-bold ml-8 mt-4">All Users</div>
            <UnderDevelopment className="w-full h-full flex flex-col justify-center" />
        </div>)
}

export default page