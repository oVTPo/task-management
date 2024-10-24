import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase'; // Đảm bảo đường dẫn đúng

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import LogoutIcon from '@mui/icons-material/Logout';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Đăng xuất thất bại:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar */}
      <nav className="w-64 bg-gray-800 text-white flex flex-col h-screen"> {/* Thêm h-screen */}
        <div className="p-6 flex-grow">
          <div className="flex items-center mb-8">
            <div className="text-white font-semibold text-xl">Dashboard</div>
          </div>
          <ul className="space-y-4">
            <li>
              <Link to="/admin/dashboard" className="flex items-center space-x-3 text-white hover:bg-gray-700 p-2 rounded-md">
                <HomeOutlinedIcon />
                <span>Trang chủ</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/team" className="flex items-center space-x-3 text-white hover:bg-gray-700 p-2 rounded-md">
                <PeopleAltOutlinedIcon />
                <span>Người dùng</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/calendar" className="flex items-center space-x-3 text-white hover:bg-gray-700 p-2 rounded-md">
                <CalendarTodayOutlinedIcon />
                <span>Lịch đăng bài</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/task-list" className="flex items-center space-x-3 text-white hover:bg-gray-700 p-2 rounded-md">
                <TaskAltOutlinedIcon />
                <span>Danh sách nhiệm vụ</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/reports" className="flex items-center space-x-3 text-white hover:bg-gray-700 p-2 rounded-md">
                <LeaderboardOutlinedIcon />
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
      <div className="flex-1 p-6 bg-gray-100 overflow-y-auto h-screen"> {/* Thêm h-screen và overflow-y-auto */}
        <Outlet /> {/* Hiển thị trang con */}
      </div>
    </div>
  );
};

export default AdminLayout;
