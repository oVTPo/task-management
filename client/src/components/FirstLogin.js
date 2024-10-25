import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

import { firestore } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

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
    <div>
      <h1>Đăng Nhập Lần Đầu</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            onBlur={checkEmail} // Kiểm tra email khi mất focus
            required 
          />
        </div>
        {isEmailValid && (
          <div>
            <label>Mật khẩu mới:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={!isEmailValid}>Thiết lập mật khẩu</button>
      </form>
    </div>
  );
};

export default FirstLogin;
