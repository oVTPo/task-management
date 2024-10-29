import React, { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { firestore } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import getImageURL from '../utils/getImage';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CircularProgress from '@mui/material/CircularProgress'; // Import loading spinner

const FirstLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // State for loading
  const navigate = useNavigate();

  const [imageURL, setImageURL] = useState(null);
  const imageName = "IconNG.png";

  useEffect(() => {
    const fetchImage = async () => {
      const url = await getImageURL(imageName);
      setImageURL(url);
    };

    fetchImage();
  }, [imageName]);

  const checkEmail = async () => {
    setError('');
    setIsLoading(true); // Start loading

    try {
      const q = query(collection(firestore, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setIsEmailValid(true);
      } else {
        setError('Email không tồn tại.');
        setIsEmailValid(false);
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra email:", error);
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    }

    setIsLoading(false); // End loading
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // Start loading

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, 'temporaryPassword123');
      const user = auth.currentUser;
      await updatePassword(user, password);

      alert('Mật khẩu đã được thiết lập thành công! Bạn có thể đăng nhập.');
      navigate('/login');
    } catch (error) {
      console.error('Lỗi khi thiết lập mật khẩu:', error);
      setError('Có lỗi xảy ra khi thiết lập mật khẩu. Vui lòng thử lại.');
    }

    setIsLoading(false); // End loading
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <div className="justify-center flex mb-2">
          <img src={imageURL} alt="Icon NG" className="w-16 h-16 rounded-full" />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">Đăng Nhập Lần Đầu</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <label className="block text-gray-700 mb-2">Email</label>
            <div className={`w-full border border-gray-300 rounded p-2 justify-between flex ${isEmailValid ? 'border-green-500' : 'border-gray-700'}`}>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                onBlur={checkEmail} 
                placeholder="Nhập email" 
                required 
                className={`flex-1 border-none focus:outline-none focus:ring-0 ${isEmailValid ? 'text-green-500' : 'text-gray-700'}`}
                disabled={isLoading}
              />
              {isLoading ? (
                <CircularProgress size={20} className="text-blue-500" /> // Loading spinner
              ) : (
                isEmailValid && (
                  <CheckCircleOutlineIcon 
                    className="text-green-500" 
                  />
                )
              )}
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
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
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200" 
            disabled={!isEmailValid || isLoading}
          >
            {isLoading ? <CircularProgress size={20} className="text-white" /> : 'Thiết lập mật khẩu'}
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
