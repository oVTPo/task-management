import React from 'react'
import UserSchedules from '../UserSchedules'


const AdminDashboard = () => {
  return (
    <>
      <div className="flex justify-between items-center bg-white p-6 mb-6 rounded-lg shadow-md w-full">
        <div>
          <h1 className='text-4xl text-primary font-bold mb-2'>Tổng quan</h1>
        </div>
      </div>
      <div className="grid grid-cols-8 gap-6">
        <div className='col-span-5 row-span-4'>
          <UserSchedules/>
        </div>
      </div>
    </>
  )
}

export default AdminDashboard
