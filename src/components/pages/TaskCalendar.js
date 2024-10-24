import React from 'react'

const TaskCalendar = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-white">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <h1 className="text-3xl font-bold mb-4 text-blue-500">Sắp ra mắt tính năng mới</h1>
            <p className="text-lg text-gray-700 mb-6">
            Chúng tôi đang phát triển các tính năng mới, hãy quay lại sớm để khám phá nhé!
            </p>
            <div className="flex justify-center">
            <div class="w-8 h-8 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
            </div>
        </div>
    </div>
  )
}

export default TaskCalendar
