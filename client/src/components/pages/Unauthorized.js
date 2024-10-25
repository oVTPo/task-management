import React from 'react';

const Unauthorized = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-100 text-center p-4">
      <h2 className="text-2xl font-bold text-red-600 mb-2">Bạn không có quyền truy cập vào trang này!</h2>
      <p className="text-lg text-gray-600 mb-4">Xin vui lòng đăng nhập để tiếp tục.</p>
      <a 
        href="/login" 
        className="text-white bg-blue-500 hover:bg-blue-600 font-semibold py-2 px-4 rounded"
      >
        Đăng nhập lại
      </a>
    </div>
  );
};

export default Unauthorized;
