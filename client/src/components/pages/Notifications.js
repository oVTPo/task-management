// src/components/TaskNotifications.js
import React, { useEffect, useState } from 'react';
import { subscribeToTaskNotifications } from '../../utils/taskNotification';
import NotificationItem from '../NotificationItem';
import { getAuth } from 'firebase/auth'; // Nhập getAuth từ firebase/auth

const TaskNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const auth = getAuth(); // Lấy auth từ Firebase

  useEffect(() => {
    const currentUser = auth.currentUser; // Lấy người dùng hiện tại

    if (currentUser) {
      const uid = currentUser.uid; // Lấy UID của người dùng

      // Đăng ký nhận thông báo và cập nhật vào danh sách notifications
      const unsubscribe = subscribeToTaskNotifications(uid, (task) => {
        setNotifications((prev) => [...prev, task]);
      });

      // Hủy đăng ký khi component bị tháo gỡ
      return () => unsubscribe();
    } else {
      console.log('No user is signed in.');
    }
  }, [auth]);

  return (
    <div className="bg-gray-100 rounded p-4 w-full h-screen mt-4 overflow-hidden">
      <div className='bg-white shadow-lg rounded-lg p-6 mb-6'>
        <h2 className="text-lg font-semibold">Thông báo</h2>
      </div>
      <div>
        <div className='overflow-y-auto h-[52rem]'> {/* Sử dụng chiều cao tùy chỉnh */}
          {notifications.length > 0 ? (
            notifications.slice().reverse().map((task, index) => ( // Đảo ngược thứ tự thông báo
              <NotificationItem key={index} task={task} />
            ))
          ) : (
            <p className="text-gray-500">Không có thông báo nào.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskNotifications;
