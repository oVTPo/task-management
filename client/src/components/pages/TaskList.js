import React, { useEffect, useState, useRef } from 'react';
import { firestore } from '../../firebase';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faPrint, faFileExcel } from '@fortawesome/free-solid-svg-icons';


import { importTasksFromExcel } from '../../utils/importTasksFromExcel';

import Popup from '../layout/Popup';

const TaskList = () => {
  const fileInputRef = useRef(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState(null); // Form để thêm nhiệm vụ mới
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskData, setEditTaskData] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const taskTypes = ['Tất cả','Thiết kế', 'Content', 'Chụp/Quay', 'Xử lý ảnh', 'Kế hoạch', 'Edit video', 'Website'];
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  

  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 8;

  // Tính toán chỉ số đầu và cuối của nhiệm vụ hiện tại
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Tổng số trang
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  //Lọc
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');


  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [typeFilter, setTypeFilter] = useState('Tất cả');
  const [progressFilter, setProgressFilter] = useState('Tất cả');
  const [assignToFilter, setAssignToFilter] = useState('Tất cả');

 // Hàm bật/tắt popup thêm người dùng
  const togglePopup = (type) => {
    setActionType(type);
    setIsPopupOpen(!isPopupOpen);
  };

  //Up file .xlsx
  const handleFileUploadClick = () => {
    fileInputRef.current.click(); // Mở hộp thoại chọn file
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true); // Bắt đầu trạng thái loading
      try {
        await importTasksFromExcel(file); // Đợi cho đến khi nhập hoàn tất
        setSuccess(true); // Đặt trạng thái thành công sau khi hoàn tất
        await fetchTasks(); // Gọi fetchTasks ngay sau khi hoàn tất nhập
      } catch (error) {
        console.error('Lỗi khi nhập file:', error);
        setSuccess(false); // Nếu có lỗi, đảm bảo trạng thái không thành công
      } finally {
        setLoading(false); // Kết thúc trạng thái loading
        setTimeout(() => setSuccess(false), 2000);
        setTimeout(() => setNewTask(null), 2000);
      }
    }
  };
  
  
  
  

  useEffect(() => {
    const filtered = tasks.filter(task => {
        const matchesStatus = statusFilter === 'Tất cả' || task.status === statusFilter;
        const matchesType = typeFilter === 'Tất cả' || task.type === typeFilter;
        const matchesProgress = progressFilter === 'Tất cả' || task.progressStatus === progressFilter;
        const matchesAssignTo = assignToFilter === 'Tất cả' || task.assignedTo === assignToFilter;
        const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || task.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesType && matchesProgress && matchesSearch && matchesAssignTo;
    });

    // Sắp xếp các nhiệm vụ đã lọc
    const sortedFilteredTasks = filtered.sort((a, b) => {
      const deadlineA = a.deadline ? new Date(a.deadline.seconds * 1000) : 0;
      const deadlineB = b.deadline ? new Date(b.deadline.seconds * 1000) : 0;
      return sortOrder === 'asc' ? deadlineA - deadlineB : deadlineB - deadlineA; // Tăng hoặc giảm
    });

    setFilteredTasks(sortedFilteredTasks);
}, [statusFilter, typeFilter, progressFilter, tasks, sortOrder, searchTerm, assignToFilter]);

  const handleSortToggle = () => {
    setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
};


  // Định nghĩa hàm fetchTasks ngoài useEffect để có thể dùng lại nhiều nơi
const fetchTasks = async () => {
  try {
    const tasksCollection = collection(firestore, 'tasks');
    const tasksSnapshot = await getDocs(tasksCollection);
    const tasksList = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      deadline: doc.data().deadline ? doc.data().deadline.toDate() : null,
    }));
    setTasks(tasksList); // Cập nhật danh sách nhiệm vụ vào state
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhiệm vụ:", error);
  }
};

// Định nghĩa hàm fetchUsers ngoài useEffect
const fetchUsers = async () => {
  try {
    const usersCollection = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const usersMap = usersList.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {});
    
    setUsersMap(usersMap); // Cập nhật map người dùng vào state
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
  }
};

// useEffect để gọi fetchTasks và fetchUsers khi component mount
useEffect(() => {
  fetchTasks();
  fetchUsers();
}, []);
  
  

// Trong hàm handleEditTask:
const handleEditTask = async () => {
  setLoading(true);
  setSuccess(false);
  
  try {
    const taskDoc = doc(firestore, 'tasks', editTaskId);

    // Chuyển đổi giá trị deadline từ input thành timestamp
    const deadlineTimestamp = editTaskData.deadline
      ? Timestamp.fromDate(new Date(editTaskData.deadline))
      : null;

    const updatedData = {
      name: editTaskData.name || '',
      description: editTaskData.description || '',
      status: editTaskData.status || 'Mới',
      type: editTaskData.type || '',
      deadline: deadlineTimestamp,
      assignedTo: editTaskData.assignedTo || '',
    };


    // Xóa các trường có giá trị undefined
    Object.keys(updatedData).forEach(key => {
      if (updatedData[key] === undefined) {
        delete updatedData[key];
      }
    });

    if (Object.keys(updatedData).length > 0) {
      await updateDoc(taskDoc, updatedData);
    }

    setSuccess(true); // Set success to true after successful save
    setTimeout(() => setSuccess(false), 2000);
    setTimeout(() => setEditTaskId(null), 2000);
    setTimeout(() => setEditTaskData({}), 2000); 
    await fetchTasks(); 
  } catch (error) {
    console.error("Lỗi khi cập nhật nhiệm vụ:", error);
    alert("Đã xảy ra lỗi khi lưu chỉnh sửa.");
  } finally {
    setLoading(false);
  }
};




const handleAddTask = async () => {
  setLoading(true);
  setSuccess(false);
  try {
    const tasksCollection = collection(firestore, 'tasks');

    // Chuyển đổi deadline sang Firestore Timestamp (nếu có)
    const timestampDeadline = newTask.deadline 
      ? Timestamp.fromDate(new Date(newTask.deadline)) 
      : null;

    await addDoc(tasksCollection, {
      ...newTask,
      status: 'Mới',
      productLink: null,
      deadline: timestampDeadline, // Lưu Timestamp vào deadline
      type: newTask.type,
      progressStatus: null
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    setNewTask(null);
    setTimeout(() => togglePopup(), 2000);
    await fetchTasks();
  } catch (error) {
    console.error("Lỗi khi thêm nhiệm vụ mới:", error);
  } finally {
    setLoading(false);
  }
};



  const handleDeleteTask = async (id) => {
    try {
      setLoading(true);
      await deleteDoc(doc(firestore, 'tasks', id));
      fetchTasks(); // Cập nhật danh sách nhiệm vụ sau khi xóa
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi xoá nhiệm vụ:", error);
    }
  };

  return (
    <div className="p-8 bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex space-x-4 align-middle">
        <div className="flex items-center px-2 border border-gray-300 rounded w-3/5 min-h-full">
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
            <label className="mr-2">Lọc theo người dùng:</label>
            <select
              value={assignToFilter}
              onChange={(e) => setAssignToFilter(e.target.value)}
              className="border p-1 rounded-lg"
            >
              <option value="Tất cả">Tất cả</option>
              {Object.entries(usersMap).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
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
        <div className="flex justify-between mb-4">
          <button
            onClick={() => {
              setNewTask({
                name: '',
                description: '',
                assignedTo: Object.keys(usersMap)[0] || '',
                deadline: '',
                type: taskTypes[0] || '',
              });
              setEditMode(false);
              togglePopup('add');
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg items-center"
          >
            <AddIcon className='mr-1'/>
            Thêm Nhiệm Vụ
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg"
          >
            {editMode ? 'Thoát' : 'Chỉnh Sửa'}
          </button>
        </div>
        {/* Bảng nhiệm vụ */}
      <table className="min-w-full h-full table-auto bg-white rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/6">Nhiệm Vụ</th>
            <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/12">Loại</th>
            <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/4">Chi Tiết</th>
            <th className="py-4 px-6 text-center text-gray-600 font-semibold w-1/12">Thực Hiện</th>
            <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/12">
            <div 
                className="inline-flex items-center cursor-pointer" 
                onClick={handleSortToggle} 
                aria-label="Sắp xếp theo hạn chót"
            >
                <span className="mr-1">Hạn Chót</span>
                {sortOrder === 'asc' ? (
                    <ExpandLessIcon className="text-gray-700" />
                ) : (
                    <ExpandMoreIcon className="text-gray-700" />
                )}
            </div>
            </th>
            <th className="py-4 px-6 text-center text-gray-600 font-semibold w-1/12">Trạng thái</th>
            <th className="py-4 px-6 text-center text-gray-600 font-semibold w-1/12">Tiến độ</th>
            <th className="py-4 px-6 text-center text-gray-600 font-semibold w-1/12">Thành Phẩm</th>
            {editMode && <th className="py-4 px-6 w-1/6"></th>}
          </tr>
        </thead>

        <tbody>
        {loading ? (
          <tr>
            <td colSpan="8" className="px-4 py-2 text-center">Đang tải dữ liệu...</td>
          </tr>
        ) : currentTasks.length > 0 ? (
          currentTasks.map((task, index) => {
            const deadlineDate = task.deadline ? new Date(task.deadline.seconds * 1000) : null;
            return (
              <tr key={task.id} className={`hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-4 py-6">{task.name}</td>
                <td className="py-4 px-6">{task.type}</td>
                <td className="py-4 px-6">{task.description}</td>
                <td className="py-4 px-6 text-center">{usersMap[task.assignedTo]}</td>
                <td className="py-4 px-6 text-center">
                  {task.deadline ? (
                    new Date(task.deadline).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
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
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-1 rounded-full font-semibold text-sm ${
                    task.progressStatus === 'Trễ <24h'
                      ? 'bg-red-200 text-red-700'
                      : task.progressStatus === 'Trễ >24h'
                      ? 'bg-red-200 text-red-700'
                      : task.progressStatus === 'Trễ tiến độ'
                      ? 'bg-red-200 text-red-700'
                      : task.progressStatus === 'Đúng tiến độ'
                      ? 'bg-green-200 text-green-700'
                      : task.progressStatus === '--'
                      ? 'bg-gray-200 text-gray-700'
                      : ''
                  }`}>
                    {task.progressStatus}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  {task.productLink ? (
                    <span className="px-2 py-1 rounded-full font-semibold text-sm bg-blue-200 text-blue-700">
                      <a href={task.productLink} target="_blank" rel="noopener noreferrer">Xem</a>
                    </span>
                  ) : (
                    '--'
                  )}
                </td>
                {editMode && (
                  <td className="py-4 px-6 flex space-x-2 text-center items-center">
                    <span
                      onClick={() => {
                        setEditTaskId(task.id);
                        setEditTaskData({
                          name: task.name,
                          description: task.description,
                          type: task.type,
                          deadline: task.deadline instanceof Timestamp 
                            ? new Date(task.deadline.toMillis()).toISOString().slice(0, 16) 
                            : '', // Nếu không phải là Timestamp, bạn có thể để là rỗng hoặc xử lý phù hợp
                        });
                        togglePopup('edit');
                      }}
                      className="cursor-pointer px-2 py-1 font-semibold text-sm text-blue-700 hover:underline"
                    >
                      Chỉnh Sửa
                    </span>
                    <span
                      onClick={() => handleDeleteTask(task.id)}
                      className="cursor-pointer px-2 py-1 font-semibold text-sm text-red-700 hover:underline"
                    >
                      Xoá
                    </span>
                  </td>
                )}
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="8" className="px-4 py-2 text-center">Không có nhiệm vụ nào được giao.</td>
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










      {/* Form Thêm Nhiệm Vụ */}
      {newTask && actionType === 'add' && (
      <Popup isOpen={isPopupOpen} onClose={togglePopup}>
            <h3 className="text-2xl font-bold mb-8">Thêm Nhiệm Vụ Mới</h3>
            <div className="w-full">
              <div className='mb-4'>
                <input
                  type="text"
                  placeholder="Tên nhiệm vụ"
                  value={newTask.name}
                  onChange={e => setNewTask({ ...newTask, name: e.target.value })}
                  className="border p-2 rounded-lg flex-grow w-full"
                />
              </div>
              <div className='flex mb-4'>
                <select
                  value={newTask.type}
                  onChange={e => setNewTask({ ...newTask, type: e.target.value })}
                  className="border p-2 mr-4 rounded-lg flex-grow"
                >
                  {taskTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  value={newTask.assignedTo}
                  onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  className="border p-2 mr-4 rounded-lg flex-grow"
                >
                  {Object.entries(usersMap).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <input
                type="datetime-local"
                value={newTask.deadline || ''}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                className='border p-2 rounded-lg'
              />
              </div>
              <div className='flex-grow mb-2'>
                <textarea
                  placeholder="Mô tả nhiệm vụ"
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className="border p-2 rounded-lg w-full h-2/3"
                />
              </div>
              <div className='flex justify-end'>
                <button type="button" onClick={togglePopup} className="bg-gray-500 text-white p-2 rounded-lg mr-2">
                  Hủy
                </button>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }} // Ẩn input file
                />
                <button
                  type="button"
                  onClick={handleFileUploadClick}
                  className="bg-gray-500 text-white p-2 rounded-lg mr-2"
                >
                  <FontAwesomeIcon icon={faFileExcel} className='mr-1'/>
                  Thêm từ .xlsx
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={loading || success}
                  className={`px-4 py-2 rounded-lg col-span-2 ${
                    success ? "bg-green-500 text-white" : "bg-primary text-white"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        aria-hidden="true"
                        className="inline w-4 h-4 text-white-200 animate-spin dark:text-white-600 fill-white-600 mr-2"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="currentColor"
                        />
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentFill"
                        />
                      </svg>
                      Đang tạo...
                    </div>
                  ) : success ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="w-4 h-4 mr-2 text-white animate-bounce"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Đã lưu
                    </div>
                  ) : (
                    'Lưu Nhiệm Vụ'
                  )}
                </button>
              </div>
            </div>
         </Popup>
                  
        )}
        {editTaskId && actionType === 'edit' && (
        <Popup isOpen={isPopupOpen} onClose={togglePopup}>
          <h3 className="text-2xl font-semibold mb-8">Chỉnh Sửa Nhiệm Vụ</h3>
          <div className="w-full">
            <div className='mb-4'>
              <input
                type="text"
                placeholder="Tên nhiệm vụ"
                value={editTaskData.name || ''}
                onChange={e => setEditTaskData({ ...editTaskData, name: e.target.value })}
                className="border p-2 rounded-lg flex-grow w-full "
              />
            </div>
            <div className='justify-between flex mb-4'>
            <select
                value={editTaskData.assignedTo || ''}
                onChange={e => setEditTaskData({ ...editTaskData, assignedTo: e.target.value })}
                className="border p-2 rounded-lg mr-4 w-full"
              >
                <option value="" disabled>Chọn người dùng</option>
                {usersMap && Object.entries(usersMap).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
            </select>   
              <select
                  value={editTaskData.type}
                  onChange={e => setEditTaskData({ ...editTaskData, type: e.target.value })}
                  className="border p-2 mr-4 rounded-lg flex-grow"
                >
                  {taskTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              <select
              value={editTaskData.status || ''}
              onChange={e => setEditTaskData({ ...editTaskData, status: e.target.value })}
              className="border p-2 rounded-lg mr-4 w-full"
            >
              <option value="Mới">Mới</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Sửa lại">Sửa lại</option>
            </select>
            <input
                type="datetime-local"
                value={editTaskData.deadline || ''} // Đảm bảo giá trị không phải là undefined
                onChange={(e) => setEditTaskData({ 
                  ...editTaskData, 
                  deadline: e.target.value // Cập nhật giá trị deadline từ input
                })}
                className="border p-2 rounded-lg"
              />
            </div>
            <textarea
              placeholder="Mô tả nhiệm vụ"
              value={editTaskData.description || ''}
              onChange={e => setEditTaskData({ ...editTaskData, description: e.target.value })}
              className="border p-2 rounded-lg col-span-2 w-full mb-4"
            />
            <div className='flex justify-end'>
                <button type="button" onClick={togglePopup} className="bg-gray-500 text-white p-2 rounded-lg mr-2">
                  Hủy
                </button>
                <button
                  onClick={handleEditTask}
                  disabled={loading || success}
                  className={`px-4 py-2 rounded-lg col-span-2 ${
                    success ? "bg-green-500 text-white" : "bg-primary text-white"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        aria-hidden="true"
                        className="inline w-4 h-4 text-white-200 animate-spin dark:text-white-600 fill-white-600 mr-2"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="currentColor"
                        />
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentFill"
                        />
                      </svg>
                      Đang lưu...
                    </div>
                  ) : success ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="w-4 h-4 mr-2 text-white animate-bounce"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Đã lưu
                    </div>
                  ) : (
                    'Lưu Nhiệm Vụ'
                  )}
                </button>
              </div>
          </div>
        </Popup>
        )}
      </div>
    </div>
  );
};

export default TaskList;