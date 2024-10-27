// src/components/NotificationItem.js
import React from 'react';

const NotificationItem = ({ task, previousTask }) => {
  const { name, description, status, deadline } = task;

  let title;

  if (status === 'Sửa lại') {
    title = "🔴 Bạn cần sửa lại thành phẩm";
  } else if (previousTask && previousTask.deadline !== deadline) {
    title = "⏳ Hạn chót thay đổi";
  } else if (status === 'Mới') {
    title = "🔔 Nhiệm vụ mới!";
  } else {
    title = "✏️ Nhiệm vụ đã được chỉnh sửa"; // Default case for any other updates
  }

  return (
    <div className="bg-white border p-3 rounded-lg mb-2 shadow-lg">
        <div className='flex justify-between'>
            <div className='flex items-center'>
                <h1 className='mr-1 text-primary font-bold text-lg'>{title}</h1>
                <h3 className="font-semibold text-lg">{name}</h3>
            </div>
            <span className={`px-2 py-1 rounded-full font-semibold text-sm ${
                status === 'Mới'
                    ? 'bg-yellow-200 text-yellow-700'
                    : status === 'Hoàn Thành'
                    ? 'bg-green-200 text-green-700'
                    : status === 'Sửa lại'
                    ? 'bg-red-700 text-white'
                    : 'bg-gray-200 text-gray-600' // Mặc định cho các trạng thái khác
                }`}>
            {status}
            </span>
        </div>
        <p className="text-gray-600 mb-2">{description}</p>
        <div className='justify-end flex'>
            {deadline && (
                <p className="text-gray-500 text-sm italic">
                Hạn chót {new Date(deadline.seconds * 1000).toLocaleDateString()}
                </p>
            )}
        </div>
    </div>
  );
};

export default NotificationItem;
