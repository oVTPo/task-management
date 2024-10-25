import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; 

const PrivateRoute = ({ children, requiredRole }) => {
  const { currentUser, userData } = useAuth();

  // Nếu chưa đăng nhập, chuyển hướng đến trang login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Nếu người dùng đã đăng nhập nhưng không có quyền admin
  if (requiredRole && userData?.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default PrivateRoute;
