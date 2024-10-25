import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

import { firestore } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const FirstLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const navigate = useNavigate();

  const checkEmail = async () => {
    const auth = getAuth();
    setError(''); // Reset error message
  
    try {
      // Tạo truy vấn để tìm kiếm email trong collection 'users'
      const q = query(collection(firestore, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        // Nếu tìm thấy ít nhất một tài liệu có email
        setIsEmailValid(true);
      } else {
        setError('Email không tồn tại.');
        setIsEmailValid(false);
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra email:", error);
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const auth = getAuth();

    setError(''); // Reset error message

    try {
      // Đăng nhập người dùng với email và mật khẩu tạm thời
      await signInWithEmailAndPassword(auth, email, 'temporaryPassword123');

      // Cập nhật mật khẩu cho tài khoản
      const user = auth.currentUser;
      await updatePassword(user, password);

      alert('Mật khẩu đã được thiết lập thành công! Bạn có thể đăng nhập.');
      navigate('/login'); // Chuyển hướng về trang đăng nhập
    } catch (error) {
      console.error('Lỗi khi thiết lập mật khẩu:', error);
      setError('Có lỗi xảy ra khi thiết lập mật khẩu. Vui lòng thử lại.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Đăng Nhập Lần Đầu</h2>
        <form onSubmit={handleSubmit}>
        <div className="mb-4 relative"> {/* Set relative positioning for the parent */}
          <label className="block text-gray-700 mb-2">Email</label>
          {/* <div className="w-full border border-gray-300 rounded p-2 justify-between flex"> */}
          <div className={`w-full border border-gray-300 rounded p-2 justify-between flex ${isEmailValid ? 'border-green-500' : 'border-gray-700'}`}>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              onBlur={checkEmail} // Check email on blur
              placeholder="Nhập email" 
              required 
              className={`flex-1 border-none focus:outline-none focus:ring-0 ${isEmailValid ? 'text-green-500' : 'text-gray-700'}`}
            />
            {isEmailValid && (
              <CheckCircleOutlineIcon 
                className="text-green-500" 
              />
            )}
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>} {/* Display error message if needed */}
        </div>
          <div 
            className={`mb-4 transition-all duration-1000 ease-in-out overflow-hidden ${isEmailValid ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <label className="block text-gray-700 mb-2">Mật khẩu mới</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Nhập mật khẩu mới" 
              required 
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200" 
            disabled={!isEmailValid}
          >
            Thiết lập mật khẩu
          </button>
        </form>
        <div className="mt-4 text-center">
          <a href="/login" className="text-blue-600 hover:underline">
            Đã có tài khoản? Đăng nhập
          </a>
        </div>
      </div>
    </div>
  );
};

export default FirstLogin;
