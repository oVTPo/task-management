import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase'; // Đảm bảo đường dẫn đúng
import { setUserOfflineStatus } from '../../utils/userStatus';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';

const UserLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const uid = auth.currentUser.uid;
    try {
      setUserOfflineStatus(uid)
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Đăng xuất thất bại:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <nav className="w-64 bg-gray-800 text-white flex flex-col h-auto">
        <div className="p-6 flex-grow">
          <div className="flex items-center mb-8">
            <div className="text-white font-semibold text-xl">Dashboard</div>
          </div>
          <ul className="space-y-4">
            <li>
              <Link to="/user/dashboard" className="flex items-center space-x-3 text-white hover:bg-gray-700 p-2 rounded-md">
                <HomeOutlinedIcon />
                <span>Trang chủ</span>
              </Link>
            </li>
            <li>
              <Link to="/user/calendar" className="flex items-center space-x-3 text-white hover:bg-gray-700 p-2 rounded-md">
                <CalendarTodayOutlinedIcon />
                <span>Lịch trình</span>
              </Link>
            </li>
            <li>
              <Link to="/user/task-list" className="flex items-center space-x-3 text-white hover:bg-gray-700 p-2 rounded-md">
                <TaskAltOutlinedIcon />
                <span>Danh sách nhiệm vụ</span>
              </Link>
            </li>
            <li>
              <Link to="/user/reports" className="flex items-center space-x-3 text-white hover:bg-gray-700 p-2 rounded-md">
                <BarChartIcon />
                <span>Thống kê</span>
              </Link>
            </li>
          </ul>
        </div>
        <div className="p-6">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-red-500 hover:bg-gray-700 p-2 rounded-md w-full"
          >
            <LogoutIcon />
            <span>Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* Nội dung chính */}
      <div className="flex-1 p-6 bg-gray-100">
        <Outlet /> {/* Hiển thị trang con */}
      </div>
    </div>
  );
};

export default UserLayout;
