import React from 'react'
import DashboardNavbar from './components/DashboardNavbar'

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <DashboardNavbar />
      <div className='pt-96 lg:pt-76 min-h-screen w-full'>
        {children}
      </div>
    </>
  )
}

export default DashboardLayout