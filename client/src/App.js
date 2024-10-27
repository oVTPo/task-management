import './index.css'; // Đảm bảo đường dẫn chính xác đến tệp CSS

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { auth } from './firebase'; // Import Firebase auth
import { onAuthStateChanged } from "firebase/auth";
import LoginPage from "./components/LoginPage"; // Trang đăng nhập
import PrivateRoute from "./PrivateRoute"; // Đã tạo ở trên

import AdminLayout from './components/layout/AdminLayout';
import UserLayout from './components/layout/UserLayout';
import CreateTask from './components/pages/CreateTask';
import TaskList from './components/pages/TaskList';
import TaskListUser from './components/pages/TaskListUser';
import Team from './components/pages/Team';
import Calendar from './components/pages/Calendar';
import UserDashboard from './components/pages/UserDashboard';

import Unauthorized from './components/pages/Unauthorized';
import AdminDashboard from './components/pages/AdminDashboard';
import TaskCalendar from './components/pages/TaskCalendar';
import Reports from './components/pages/Reports';
import Notification from './components/pages/Notifications';

import { setUserOnlineStatus } from './utils/userStatus'; // Import hàm cập nhật trạng thái online
import FirstLogin from './components/FirstLogin';

function App() {
  const [userId, setUserId] = useState(null); // Tạo state để lưu trữ userId

  useEffect(() => {
    // Lắng nghe trạng thái đăng nhập của người dùng
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Nếu người dùng đã đăng nhập, lấy userId
        setUserId(user.uid);
        console.log("User ID sau khi đăng nhập:", user.uid);

        // Gọi hàm để cập nhật trạng thái online
        setUserOnlineStatus(user.uid); // Cập nhật trạng thái online
      } else {
        setUserId(null); // Nếu không có user, reset userId
      }
    });

    return () => unsubscribe(); // Hủy đăng ký listener khi component bị unmount
  }, []);

  return (
    <Router>
      <Routes>
        {/* Các route công khai */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/first-login" element={<FirstLogin />} />
        <Route 
          path="/user" 
          element={
          <PrivateRoute requiredRole="user">
            <UserLayout />
          </PrivateRoute>
         }
        >
          <Route path="task-list" element={<TaskListUser userId={userId} />} />
          <Route path="calendar" element={<TaskCalendar />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="notifications" element={<Notification />} />
        </Route>

        {/* Route cần bảo vệ cho admin */}
        <Route
          path="/admin"
          element={
            <PrivateRoute requiredRole="admin">
              <AdminLayout />
            </PrivateRoute>
          }
        >
          {/* Các route con của admin */}
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="create-task" element={<CreateTask />} />
          <Route path="task-list" element={<TaskList />} />
          <Route path="team" element={<Team />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="reports" element={<Reports />} />
          {/* Bạn có thể thêm các route khác tại đây */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
