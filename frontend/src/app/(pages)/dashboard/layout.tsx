import React from 'react'
import DashboardNavbar from './components/DashboardNavbar'
import AuthGuard from '@/components/shared/AuthGuard'
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Airkrit",
  description: "Dashboard | Airkrit",
  keywords: ["Dashboard", "Airkrit", "Dashboard | Airkrit"],
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      <DashboardNavbar />
      <div className='pt-96 lg:pt-76 min-h-screen w-full'>
        {children}
      </div>
    </AuthGuard>
  )
}

export default DashboardLayout