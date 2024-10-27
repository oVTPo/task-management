import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase'; // Import Firebase auth
import { onAuthStateChanged } from "firebase/auth";
import { getUserData } from './utils'; // Hàm để lấy dữ liệu người dùng từ Firestore

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user); // Cập nhật currentUser

      if (user) {
        // Lấy dữ liệu người dùng từ Firestore
        const data = await getUserData(user.uid);
        setUserData(data); // Cập nhật userData
      } else {
        setUserData(null); // Nếu không có người dùng, reset userData
      }
    });

    return () => unsubscribe(); // Hủy đăng ký khi component bị unmount
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook để sử dụng AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
