import React from "react";

// Popup component
const Popup = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null; // Nếu popup không mở, không render gì cả

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-1/3">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            Đóng ✖
          </button>
        </div>
        <div>{children}</div> {/* Nội dung động của popup */}
      </div>
    </div>
  );
};

export default Popup;
