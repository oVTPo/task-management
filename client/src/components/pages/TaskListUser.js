import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import Popup from '../TaskDetails'; // Component popup cho việc upload sản phẩm
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';

const TaskListUser = ({ userId }) => {
  const [tasks, setTasks] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const taskTypes = ['Tất cả','Thiết kế', 'Content', 'Quay/Chụp', 'Xử lý ảnh', 'Kế hoạch', 'Edit video', 'Website'];

  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 8;
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const [sortOrder, setSortOrder] = useState('desc');

  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [typeFilter, setTypeFilter] = useState('Tất cả');
  const [progressFilter, setProgressFilter] = useState('Tất cả');

  useEffect(() => {
    const filtered = tasks.filter(task => {
      const matchesStatus = statusFilter === 'Tất cả' || task.status === statusFilter;
      const matchesType = typeFilter === 'Tất cả' || task.type === typeFilter;
      const matchesProgress = progressFilter === 'Tất cả' || task.progressStatus === progressFilter;
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || task.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesType && matchesProgress && matchesSearch;
    });
  
    const sortedFilteredTasks = filtered.sort((a, b) => {
      const deadlineA = a.deadline ? new Date(a.deadline.seconds * 1000) : 0;
      const deadlineB = b.deadline ? new Date(b.deadline.seconds * 1000) : 0;
      return sortOrder === 'asc' ? deadlineA - deadlineB : deadlineB - deadlineA;
    });
  
    setFilteredTasks(sortedFilteredTasks);
  }, [statusFilter, typeFilter, progressFilter, tasks, sortOrder, searchTerm]);

  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  const fetchTasks = async () => {
    try {
      const tasksCollection = collection(firestore, 'tasks');
      const q = query(tasksCollection, where("assignedTo", "==", userId));
      const tasksSnapshot = await getDocs(q);
      
      const tasksList = tasksSnapshot.docs.map((docSnapshot) => {
        const taskData = { id: docSnapshot.id, ...docSnapshot.data() };
        
        // Kiểm tra nếu progressStatus trống, hiển thị "--"
        taskData.progressStatus = taskData.progressStatus || '--';
        
        return taskData;
      });
  
      setTasks(tasksList);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };
  

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const handleShowDetails = (task) => {
    setSelectedTask(task);
    setShowDetails(true);
  };

  const handleClosePopup = () => {
    setShowDetails(false);
    setSelectedTask(null);
  };

  // Hàm callback để cập nhật lại danh sách task
  const handleTaskUpdated = () => {
    fetchTasks();
    setShowDetails(false); // Đóng popup sau khi upload xong
  };

  const handleSortToggle = () => {
    setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
  };


  return (
    <div className="p-8 bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex space-x-4 align-middle">
        <div className="flex items-center px-2 border border-gray-300 rounded w-full min-h-full">
            <SearchIcon/>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none outline-none p-1 flex-1"
              placeholder="Tìm kiếm..."
            />
          </div>
          <div>
            <label className="mr-2">Lọc theo trạng thái:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded p-1">
              <option value="Tất cả">Tất cả</option>
              <option value="Mới">Mới</option>
              <option value="Hoàn Thành">Hoàn Thành</option>
              <option value="Sửa lại">Sửa lại</option>
            </select>
          </div>
          <div>
            <label className="mr-2">Lọc theo loại:</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded p-1">
              {taskTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mr-2">Lọc theo tiến độ:</label>
            <select value={progressFilter} onChange={(e) => setProgressFilter(e.target.value)} className="border rounded p-1">
              <option value="Tất cả">Tất cả</option>
              <option value="Trễ tiến độ">Trễ tiến độ</option>
              <option value="Đúng tiến độ">Đúng tiến độ</option>
              <option value="--">Chưa có link sản phẩm</option>
            </select>
          </div>
        </div>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <table className="min-w-full h-full table-auto bg-white rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/6">Nhiệm Vụ</th>
              <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/12">Loại</th>
              <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/3">Chi Tiết</th>
              <th className="py-4 px-6 text-center text-gray-600 font-semibold w-1/12">
                <div className="inline-flex items-center cursor-pointer" onClick={handleSortToggle} aria-label="Sắp xếp theo hạn chót">
                  <span className="mr-1">Hạn Chót</span>
                  {sortOrder === 'asc' ? (
                    <ExpandLessIcon className="text-gray-700" />
                  ) : (
                    <ExpandMoreIcon className="text-gray-700" />
                  )}
                </div>
              </th>
              <th className="py-4 px-6 text-center text-gray-600 font-semibold w-1/12">Trạng Thái</th>
              <th className="py-4 px-6 text-center text-gray-600 font-semibold w-1/12">Tiến độ</th>
            </tr>
          </thead>
          <tbody>
            {currentTasks.length > 0 ? (
              currentTasks.map((task, index) => {
                const deadlineDate = task.deadline ? new Date(task.deadline.seconds * 1000) : null;
                return (
                  <tr key={task.id} onClick={() => handleShowDetails(task)} className={`hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-6">{task.name}</td>
                    <td className="py-4 px-6">{task.type}</td>
                    <td className="py-4 px-6">{task.description}</td>
                    <td className="py-4 px-6 text-center">
                      {task.deadline ? (
                        deadlineDate instanceof Date && !isNaN(deadlineDate) ? (
                          deadlineDate.toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        ) : (
                          '--'
                        )
                      ) : (
                        '--'
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2 py-1 rounded-full font-semibold text-sm ${
                        task.status === 'Mới'
                          ? 'bg-yellow-200 text-yellow-700'
                          : task.status === 'Hoàn Thành'
                          ? 'bg-green-200 text-green-700'
                          : task.status === 'Sửa lại'
                          ? 'bg-red-700 text-white'
                          : ''
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className=" px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full font-semibold text-sm ${
                        task.progressStatus === 'Trễ <24h'
                          ? 'bg-red-200 text-red-700'
                          : task.progressStatus === 'Trễ >24h'
                          ? 'bg-red-200 text-red-700'
                          : task.progressStatus === 'Trễ tiến độ'
                          ? 'bg-red-200 text-red-700'
                          : task.progressStatus === 'Đúng tiến độ'
                          ? 'bg-green-200 text-green-700'
                          : task.progressStatus === '--' // Handle '--' status
                          ? 'bg-gray-200 text-gray-700'
                          : ''
                      }`}>
                        {task.progressStatus}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-2 text-center">Không có nhiệm vụ nào được giao.</td>
              </tr>
            )}
          </tbody>
        </table>

      {/* Phân trang */}
      <div className="flex justify-between items-center py-4">
        <div>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 mr-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Trang trước
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Trang tiếp
          </button>
        </div>
        <div>
          <span>Trang {currentPage} / {totalPages}</span>
        </div>
        <div>
          {totalPages > 10 ? (
            <>
              {/* Hiển thị trang đầu tiên */}
              <button
                onClick={() => setCurrentPage(1)}
                className={`px-2 py-1 mx-1 rounded ${currentPage === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                1
              </button>

              {/* Dấu "..." nếu trang hiện tại lớn hơn 4 */}
              {currentPage > 4 && <span className="px-2 py-1 mx-1">...</span>}

              {/* Các trang gần trang hiện tại */}
              {Array.from({ length: 5 }, (_, index) => {
                let pageNum;
                if (currentPage <= 3) {
                  pageNum = index + 2; // Các trang gần trang 1
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 5 + index; // Các trang gần trang cuối
                } else {
                  pageNum = currentPage - 2 + index; // Các trang ở giữa
                }

                // Đảm bảo không vượt quá số trang hợp lệ
                pageNum = Math.max(2, Math.min(totalPages - 1, pageNum));
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 mx-1 rounded ${currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Dấu "..." nếu trang hiện tại nhỏ hơn tổng số trang trừ 4 */}
              {currentPage < totalPages - 4 && <span className="px-2 py-1 mx-1">...</span>}

              {/* Hiển thị trang cuối */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                className={`px-2 py-1 mx-1 rounded ${currentPage === totalPages ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                {totalPages}
              </button>
            </>
          ) : (
            // Hiển thị tất cả các trang nếu tổng số trang <= 10
            Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-2 py-1 mx-1 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                {index + 1}
              </button>
            ))
          )}
        </div>
      </div>

      </div>
      {showDetails && selectedTask && (
        <Popup task={selectedTask} onClose={handleClosePopup} onTaskUpdated={handleTaskUpdated} />
      )}
    </div>
  );
};

export default TaskListUser;
