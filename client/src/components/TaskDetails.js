import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase'; // Điều chỉnh đường dẫn import nếu cần
import validator from 'validator';

import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';


const TaskDetails = ({ task, onClose, onTaskUpdated }) => {
  const [productLink, setProductLink] = useState(task.productLink || ''); // Nếu có link trước đó thì hiển thị
  const [isExpanded, setIsExpanded] = useState(false); // Quản lý trạng thái mở rộng mô tả
  const [errorMessage, setErrorMessage] = useState(''); // Quản lý trạng thái lỗi

  const kpiPoints = {
    "Thiết kế": 10,
    "Content": 10,
    "Chụp/Quay": 20,
    "Xử lí ảnh": 10,
    "Kế hoạch": 15,
    "Edit video": 15,
    "Website": 50
  };
  
  // Function to handle uploading the product link
  const handleUploadLink = async () => {
    // Kiểm tra xem productLink có trống hay không
    if (!productLink.trim()) {
      setErrorMessage('Vui lòng nhập link thành phẩm');
      return;
    }
  
    // Sử dụng validator để kiểm tra xem link có phải là một URL hợp lệ bắt đầu bằng https không
    if (!validator.isURL(productLink, { protocols: ['https'], require_protocol: true })) {
      setErrorMessage('Link không hợp lệ, vui lòng kiểm tra lại');
      return;
    }
  
    try {
      const taskRef = doc(firestore, 'tasks', task.id);
  
      // Lấy thời gian hiện tại để so sánh với deadline
      const currentTime = new Date();
      const deadlineDate = task.deadline ? new Date(task.deadline.seconds * 1000) : null;
  
      // Tính toán trạng thái tiến độ
      let progressStatus = '';
      let taskPoints = kpiPoints[task.type] || 0; // Điểm KPI mặc định
      if (deadlineDate) {
        const timeDifference = currentTime - deadlineDate; // Khoảng thời gian hoàn thành sau deadline (ms)
      
        if (timeDifference > 0) {
          // Kiểm tra thời gian hoàn thành so với deadline
          const hoursLate = timeDifference / (1000 * 60 * 60); // Chuyển đổi sang giờ
          if (hoursLate <= 24) {
            progressStatus = 'Trễ <24h';
            taskPoints *= 0.5; // 50% điểm nếu trễ trong vòng 24 tiếng
          } else {
            progressStatus = 'Trễ >24h';
            taskPoints = 0; // 0 điểm nếu trễ hơn 24 tiếng
          }
        } else {
          progressStatus = 'Đúng tiến độ';
        }
      }
      
  
      // Cập nhật Firestore
      await updateDoc(taskRef, {
        productLink: productLink,
        status: 'Hoàn Thành', // Thay đổi trạng thái thành 'Hoàn thành' khi tải link
        progressStatus: progressStatus, // Cập nhật trạng thái tiến độ
        updatedAt: currentTime, // Lưu thời gian cập nhật
        kpiPoints: taskPoints // Thêm trường kpiPoints vào Firestore
      });
  
      // Gọi hàm onTaskUpdated để yêu cầu load lại task
      if (onTaskUpdated) {
        onTaskUpdated();
      }
  
      onClose(); // Đóng popup sau khi tải lên
    } catch (error) {
      console.error("Error updating task:", error);
      setErrorMessage('Có lỗi xảy ra khi tải link, vui lòng thử lại');
    }
  };


  // Định nghĩa deadlineDate để hiển thị
  const deadlineDate = task.deadline ? new Date(task.deadline.seconds * 1000) : null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-12 rounded shadow-lg max-w-3xl w-full">
        <div className='flex justify-between items-start mb-1'>
          <h2 className="text-4xl font-bold">{task.name}</h2>
          <div className={`ml-auto px-2 py-1 w-auto rounded-full font-semibold text-lg ${
            task.status === 'Mới'
              ? 'bg-yellow-200 text-yellow-700'
              : task.status === 'Hoàn Thành'
              ? 'bg-green-200 text-green-700'
              : task.status === 'Sửa lại'
              ? 'bg-red-700 text-white'
              : ''
          }`}>
            {task.status}
          </div>
        </div>

        <div className="mb-12 text-gray-500 italic">
          <AccessTimeFilledIcon />{' '}
          {deadlineDate ? (
            deadlineDate.toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          ) : (
            '--'
          )}
        </div>

        <div className="mb-4">
          <strong>Chi tiết:</strong>{' '}
          <p className={`text-gray-700 ${!isExpanded ? 'line-clamp-3' : ''} overflow-hidden`}>
            {task.description}
          </p>
          {task.description.length > 100 && (
            <button
              className="text-blue-500 mt-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>

        <label className="block mt-4">
          <span>Link Thành Phẩm:</span>
          <input
            type="text"
            value={productLink}
            onChange={(e) => {
              setProductLink(e.target.value);
              setErrorMessage(''); // Xóa lỗi khi người dùng nhập lại
            }}
            className="border rounded w-full mt-1 p-2"
            placeholder="Link thành phẩm"
          />
        </label>

        {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}

        <div className="mt-6 flex justify-end">
          <button onClick={handleUploadLink} className="bg-blue-500 text-white p-2 rounded mr-2 flex items-center">
            Đăng tải
            <SendIcon className="ml-2" />
          </button>
          <button onClick={onClose} className="bg-gray-500 text-white p-2 rounded flex items-center">
            Đóng
            <CloseIcon className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
