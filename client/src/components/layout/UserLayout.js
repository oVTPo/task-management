import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { setUserOfflineStatus } from '../../utils/userStatus';
import getImageURL from '../../utils/getImage';
import { setUserOnlineStatus } from '../../utils/userStatus';
import { logUserLogin, logUserLogout} from '../../utils/loginDuration';
import { getDoc, doc } from "firebase/firestore";
import { subscribeToTaskNotifications, listenForNotifications } from '../../utils/taskNotification';

import useSingleSession from '../hooks/useSingleSession';

import HomeIcon from '@mui/icons-material/Home';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';

const UserLayout = () => {
  const userId = auth.currentUser ? auth.currentUser.uid : null;
  useSingleSession(userId);

  const user = auth.currentUser;
  const navigate = useNavigate();
  const [imageURL, setImageURL] = useState(null);
  const [name, setName] = useState('');
  const imageName = "IconNG.png";
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // Track unread count

const handleLogout = async () => {
    const uid = auth.currentUser ? auth.currentUser.uid : null; // Lấy UID của người dùng hiện tại
    if (!uid) {
        console.error('Không tìm thấy người dùng hiện tại.');
        return; // Nếu không có UID, không tiếp tục
    }
    console.log('Đang đăng xuất cho UID:', uid); // Kiểm tra UID

    try {
        await logUserLogout(uid); // Ghi log thời gian đăng xuất
        await setUserOfflineStatus(uid); // Cập nhật trạng thái offline
        await signOut(auth); // Đăng xuất
        console.log('Đăng xuất thành công cho UID:', uid); // Thông báo thành công
        navigate('/login'); // Chuyển hướng đến trang đăng nhập
    } catch (error) {
        console.error('Đăng xuất thất bại:', error);
        // Bạn có thể thông báo cho người dùng về lỗi này ở đây nếu cần
    }
};



useEffect(() => {
  const handleUserLogin = async () => {
      if (userId) {
          console.log('Logging in user with ID:', userId); // Kiểm tra userId
          await logUserLogin(userId);
      } else {
          console.log('User ID is not defined');
      }
  };
  handleUserLogin();
}, [userId]);


  useEffect(() => {
    // Kiểm tra xem người dùng có đăng nhập hay không
    if (user) {
      // Ghi nhận trạng thái online của người dùng
      setUserOnlineStatus(user.uid);
    }
  }, [user]); // Chạy lại khi user thay đổi

  useEffect(() => {
    const fetchImage = async () => {
      const url = await getImageURL(imageName);
      setImageURL(url);
    };

    fetchImage();
  }, [imageName]);

  useEffect(() => {
    const uid = auth.currentUser.uid;

    // Subscribe to task notifications
    const unsubscribeTaskNotifications = subscribeToTaskNotifications(uid, (newTask) => {
      console.log("Nhiệm vụ mới:", newTask);
      setHasUnreadNotifications(true); // Mark as unread when new task arrives
    });

    // Listen for unread notifications
    const unsubscribeNotifications = listenForNotifications((hasUnread, unreadCount) => {
      setHasUnreadNotifications(hasUnread);
      setUnreadCount(unreadCount); // Update unread count
    });

    return () => {
      unsubscribeTaskNotifications();
      unsubscribeNotifications();
    };
  }, []);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setName(userDoc.data().name || 'Người dùng');
        } else {
          console.log("Không tìm thấy dữ liệu người dùng.");
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin người dùng:", error);
      }
    };

    fetchUserName();
  }, []);

  // Handle notification read
  const handleNotificationClick = () => {
    // Here, you would implement your logic to mark notifications as read in your Firestore
    // For example:
    // await updateNotificationStatusInFirestore(auth.currentUser.uid);
    setHasUnreadNotifications(false); // Set to false when the notification is read
    setUnreadCount(0); // Reset unread count
  };

  return (
    <div className="flex min-h-screen bg-white-900 overflow-hidden">
      {/* Sidebar */}
      <nav className="w-64 bg-white flex flex-col h-screen drop-shadow-2xl">
        <div className="p-6 flex-grow">
          <div className="flex items-center mb-12">
            {imageURL ? (
              <img src={imageURL} alt="Icon NG" className="w-16 h-16 rounded-full mr-3" />
            ) : (
              <div className="w-16 h-16 bg-gray-300 rounded-full mr-3"></div>
            )}
            <div>
              <div className="text-gray-700 font-semibold text-sm">Xin chào,</div>
              <div className="text-gray-700 font-semibold text-2xl">{name}</div>
            </div>
          </div>
          <ul className="space-y-4">
            <li>
              <NavLink
                to="/user/dashboard"
                className={({ isActive }) =>
                  `flex items-center space-x-3 font-semibold p-2 rounded-md ${
                    isActive ? 'text-primary bg-primary-50' : 'text-gray-500'
                  }`
                }
              >
                <HomeIcon />
                <span>Trang chủ</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/user/notifications"
                onClick={handleNotificationClick} // Handle click to mark as read
                className={({ isActive }) =>
                  `flex items-center space-x-3 font-semibold p-2 rounded-md ${
                    isActive ? 'text-primary bg-primary-50' : 'text-gray-500'
                  }`
                }
              >
                <div className="relative">
                  <NotificationsIcon />
                  {hasUnreadNotifications && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-white"></span> // Chấm đỏ
                  )}
                </div>
                <span>Thông báo</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/user/calendar"
                className={({ isActive }) =>
                  `flex items-center space-x-3 font-semibold p-2 rounded-md ${
                    isActive ? 'text-primary bg-primary-50' : 'text-gray-500'
                  }`
                }
              >
                <CalendarMonthIcon />
                <span>Lịch trình</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/user/task-list"
                className={({ isActive }) =>
                  `flex items-center space-x-3 font-semibold p-2 rounded-md ${
                    isActive ? 'text-primary bg-primary-50' : 'text-gray-500'
                  }`
                }
              >
                <CheckCircleIcon />
                <span>Danh sách nhiệm vụ</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/user/reports"
                className={({ isActive }) =>
                  `flex items-center space-x-3 font-semibold p-2 rounded-md ${
                    isActive ? 'text-primary bg-primary-50' : 'text-gray-500'
                  }`
                }
              >
                <BarChartIcon />
                <span>Thống kê</span>
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="p-6">
          <button
            onClick={handleLogout}
            className="flex items-center font-bold space-x-3 text-red-500 hover:bg-red-50 p-2 rounded-md w-full"
          >
            <LogoutIcon />
            <span>Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* Nội dung chính */}
      <div className="flex-1 p-6 bg-gray-100 overflow-y-auto h-screen">
        <Outlet /> {/* Hiển thị trang con */}
      </div>
    </div>
  );
};

export default UserLayout;
