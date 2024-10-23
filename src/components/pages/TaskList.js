import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState(null); // Form để thêm nhiệm vụ mới
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskData, setEditTaskData] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [editMode, setEditMode] = useState(false);
  const taskTypes = ['Tất cả','Thiết kế', 'Content', 'Quay/Chụp', 'Xử lý ảnh', 'Kế hoạch', 'Edit video', 'Website'];

  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  // Tính toán chỉ số đầu và cuối của nhiệm vụ hiện tại
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Tổng số trang
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  //Lọc
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const sortedTasks = tasks.sort((a, b) => {
    const deadlineA = a.deadline ? new Date(a.deadline.seconds * 1000) : 0;
    const deadlineB = b.deadline ? new Date(b.deadline.seconds * 1000) : 0;
    return sortOrder === 'asc' ? deadlineA - deadlineB : deadlineB - deadlineA;
  });

  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [typeFilter, setTypeFilter] = useState('Tất cả');
  const [progressFilter, setProgressFilter] = useState('Tất cả');
  const [assignToFilter, setAssignToFilter] = useState('Tất cả');

  useEffect(() => {
    const filtered = tasks.filter(task => {
      const matchesStatus = statusFilter === 'Tất cả' || task.status === statusFilter;
      const matchesType = typeFilter === 'Tất cả' || task.type === typeFilter;
      const matchesProgress = progressFilter === 'Tất cả' || task.progressStatus === progressFilter;
      const matchesAssignTo = assignToFilter === 'Tất cả' || task.assignedTo === assignToFilter;
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || task.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesType && matchesProgress && matchesSearch && matchesAssignTo;
    });
  
    const sortedFilteredTasks = filtered.sort((a, b) => {
      const deadlineA = a.deadline ? new Date(a.deadline.seconds * 1000) : 0;
      const deadlineB = b.deadline ? new Date(b.deadline.seconds * 1000) : 0;
      return sortOrder === 'asc' ? deadlineA - deadlineB : deadlineB - deadlineA;
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
  try {
    const taskDoc = doc(firestore, 'tasks', editTaskId);
    const deadlineTimestamp = editTaskData.deadline
      ? Timestamp.fromDate(new Date(editTaskData.deadline + 'Z'))
      : null;

    const updatedData = {
      name: editTaskData.name || '',
      description: editTaskData.description || '',
      status: editTaskData.status || 'Mới',
      type: editTaskData.type || '',
      deadline: deadlineTimestamp,
      assignedTo: editTaskData.assignedTo || '', // Thêm trường assignedTo
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

    await fetchTasks(); 
    setEditTaskId(null);
    setEditTaskData({});
    alert("Chỉnh sửa thành công!");
  } catch (error) {
    console.error("Lỗi khi cập nhật nhiệm vụ:", error);
    alert("Đã xảy ra lỗi khi lưu chỉnh sửa.");
  } finally {
    setLoading(false);
  }
};



const handleAddTask = async () => {
  setLoading(true);
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

    setNewTask(null);
    await fetchTasks();
  } catch (error) {
    console.error("Lỗi khi thêm nhiệm vụ mới:", error);
  } finally {
    setLoading(false);
  }
};


  const handleCancel = () => {
    setNewTask(null); // Đặt lại state của newTask về null để ẩn form
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteDoc(doc(firestore, 'tasks', id));
      fetchTasks(); // Cập nhật danh sách nhiệm vụ sau khi xóa
    } catch (error) {
      console.error("Lỗi khi xoá nhiệm vụ:", error);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const fetchedTasks = await fetchTasks();
      console.log('Nhiệm vụ sau khi fetch:', fetchedTasks); // Kiểm tra dữ liệu
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
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
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            disabled={newTask !== null}
          >
            Thêm Nhiệm Vụ
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg"
            disabled={newTask !== null}
          >
            {editMode ? 'Thoát' : 'Chỉnh Sửa'}
          </button>
        </div>
        {/* Hiển thị form chỉnh sửa nhiệm vụ */}
        {editTaskId && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Chỉnh Sửa Nhiệm Vụ</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Tên nhiệm vụ"
                value={editTaskData.name || ''}
                onChange={e => setEditTaskData({ ...editTaskData, name: e.target.value })}
                className="border p-2 rounded-lg"
              />
              <select
                value={editTaskData.assignedTo || ''}
                onChange={e => setEditTaskData({ ...editTaskData, assignedTo: e.target.value })}
                className="border p-2 rounded-lg"
              >
                {Object.entries(usersMap).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Mô tả nhiệm vụ"
                value={editTaskData.description || ''}
                onChange={e => setEditTaskData({ ...editTaskData, description: e.target.value })}
                className="border p-2 rounded-lg col-span-2"
              />
              <select
                value={editTaskData.status || ''}
                onChange={e => setEditTaskData({ ...editTaskData, status: e.target.value })}
                className="border p-2 rounded-lg"
              >
                <option value="Mới">Mới</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Sửa lại">Sửa lại</option>
              </select>
              <input
                type="datetime-local"
                value={editTaskData.deadline ? new Date(editTaskData.deadline).toISOString().slice(0, 16) : ""}
                onChange={(e) => setEditTaskData({ ...editTaskData, deadline: e.target.value })}
                className="border p-2 rounded-lg"
              />
              <button
                onClick={handleEditTask}
                className="bg-green-500 text-white px-4 py-2 rounded-lg col-span-2"
              >
                Lưu Chỉnh Sửa
              </button>
              <button
                onClick={() => setEditTaskId(null)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg col-span-2"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Form Thêm Nhiệm Vụ */}
        {newTask && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Thêm Nhiệm Vụ Mới</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Tên nhiệm vụ"
                value={newTask.name}
                onChange={e => setNewTask({ ...newTask, name: e.target.value })}
                className="border p-2 rounded-lg"
              />
              <select
                value={newTask.type}
                onChange={e => setNewTask({ ...newTask, type: e.target.value })}
                className="border p-2 rounded-lg"
              >
                {taskTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Mô tả nhiệm vụ"
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                className="border p-2 rounded-lg col-span-2"
              />
              <select
                value={newTask.assignedTo}
                onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                className="border p-2 rounded-lg"
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
              />
              <button
                onClick={handleAddTask}
                className="bg-green-500 text-white px-4 py-2 rounded-lg col-span-2"
              >
                Lưu Nhiệm Vụ
              </button>
              <button
                onClick={handleCancel}
                className="bg-red-500 text-white px-4 py-2 rounded-lg col-span-2"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
        {/* Bảng nhiệm vụ */}
      <table className="min-w-full h-full table-auto bg-white rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/6">Nhiệm Vụ</th>
            <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/12">Loại</th>
            <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/4">Chi Tiết</th>
            <th className="py-4 px-6 text-center text-gray-600 font-semibold w-1/12">Thực Hiện</th>
            <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/12">
              <div className="inline-flex items-center cursor-pointer" onClick={handleSortToggle} aria-label="Sắp xếp theo hạn chót">
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
        {filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => {
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
                    <td className=" px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full font-semibold text-sm ${
                        task.progressStatus === 'Trễ tiến độ'
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
                    <td className="py-4 px-6">
                        {task.productLink ? (
                          <span className="px-2 py-1 rounded-full font-semibold text-sm bg-blue-200 text-blue-700">
                            <a href={task.productLink} target="_blank" rel="noopener noreferrer">Xem</a>
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>
                      {editMode && (
                        <td className="py-4 px-6 flex space-x-2 text-center">
                          <span
                            onClick={() => {
                              setEditTaskId(task.id);
                              setEditTaskData({
                                name: task.name,
                                description: task.description,
                                type: task.type,
                                deadline: task.deadline,
                              });
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
                <td colSpan="6" className="px-4 py-2 text-center">Không có nhiệm vụ nào được giao.</td>
              </tr>
            )}
          {/* {loading ? (
            <tr>
              <td colSpan={editMode ? 8 : 7} className="py-4 px-6 text-center">
                Đang xử lý...
              </td>
            </tr>
          ) : (
            (currentTasks && currentTasks.length > 0 ? currentTasks.map((task, index) => (
              <tr key={task.id} className={`hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="py-4 px-6">{task.name}</td>
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
                <td className="py-4 px-6">
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
                <td className="py-4 px-6">
                  {task.productLink ? (
                    <span className="px-2 py-1 rounded-full font-semibold text-sm bg-blue-200 text-blue-700">
                      <a href={task.productLink} target="_blank" rel="noopener noreferrer">Xem</a>
                    </span>
                  ) : (
                    '--'
                  )}
                </td>
                {editMode && (
                  <td className="py-4 px-6 flex space-x-2 text-center">
                    <span
                      onClick={() => {
                        setEditTaskId(task.id);
                        setEditTaskData({
                          name: task.name,
                          description: task.description,
                          type: task.type,
                          deadline: task.deadline,
                        });
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
            )) : (
              <tr>
                <td colSpan={editMode ? 8 : 7} className="py-4 px-6 text-center">
                  Không có nhiệm vụ nào
                </td>
              </tr>
            ))
          )} */}
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
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-2 py-1 mx-1 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      </div>
    </div>
  );
};

export default TaskList;
