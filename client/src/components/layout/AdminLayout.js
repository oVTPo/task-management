import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { getDoc, doc } from "firebase/firestore";
import { setUserOfflineStatus } from '../../utils/userStatus';
import getImageURL from '../../utils/getImage';

import useSingleSession from '../hooks/useSingleSession';

import HomeIcon from '@mui/icons-material/Home';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';

const AdminLayout = () => {
  const userId = auth.currentUser ? auth.currentUser.uid : null;
  useSingleSession(userId);
  
  const navigate = useNavigate();
  const [imageURL, setImageURL] = useState(null);
  const imageName = "IconNG.png";
  const [name, setName] = useState('');

  const handleLogout = async () => {
    const uid = auth.currentUser.uid;
    try {
      setUserOfflineStatus(uid);
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Đăng xuất thất bại:', error);
    }
  };

  useEffect(() => {
    const fetchImage = async () => {
      const url = await getImageURL(imageName);
      setImageURL(url);
    };

    fetchImage();
  }, [imageName]);

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
                to="/admin/dashboard"
                className={({ isActive }) =>
                  `flex items-center space-x-3 font-semibold p-2 rounded-md ${
                    isActive ? 'text-primary bg-primary-50' : 'text-gray-500 hover:bg-primary-50 hover:text-primary'
                  }`
                }
              >
                <HomeIcon />
                <span>Trang chủ</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/team"
                className={({ isActive }) =>
                  `flex items-center space-x-3 font-semibold p-2 rounded-md ${
                    isActive ? 'text-primary bg-primary-50' : 'text-gray-500 hover:bg-primary-50 hover:text-primary'
                  }`
                }
              >
                <PeopleAltIcon />
                <span>Người dùng</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/calendar"
                className={({ isActive }) =>
                  `flex items-center space-x-3 font-semibold p-2 rounded-md ${
                    isActive ? 'text-primary bg-primary-50' : 'text-gray-500 hover:bg-primary-50 hover:text-primary'
                  }`
                }
              >
                <CalendarMonthIcon />
                <span>Lịch đăng bài</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/task-list"
                className={({ isActive }) =>
                  `flex items-center space-x-3 font-semibold p-2 rounded-md ${
                    isActive ? 'text-primary bg-primary-50' : 'text-gray-500 hover:bg-primary-50 hover:text-primary'
                  }`
                }
              >
                <CheckCircleIcon />
                <span>Danh sách nhiệm vụ</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/reports"
                className={({ isActive }) =>
                  `flex items-center space-x-3 font-semibold p-2 rounded-md ${
                    isActive ? 'text-primary bg-primary-50' : 'text-gray-500 hover:bg-primary-50 hover:text-primary'
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

export default AdminLayout;
