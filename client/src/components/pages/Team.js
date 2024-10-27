import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore, database } from '../../firebase';
import { ref, onValue , } from 'firebase/database';
import Popup from "../layout/Popup";

import { addUser } from '../../utils/addUser'; // Import hàm thêm người dùng

// import { auth, db } from '../../firebase'; // Import auth
// import { deleteDoc, doc, getFirestore } from 'firebase/firestore'; // Import hàm xóa tài liệu
// import { getAuth, deleteUser, onAuthStateChanged } from 'firebase/auth'; // Import hàm xóa người dùng từ Auth (chỉ dùng được trên server với Admin SDK)

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // State để kiểm soát chế độ chỉnh sửa
  const [isPopupOpen, setIsPopupOpen] = useState(false); // Quản lý trạng thái mở/đóng popup
  const [newUser, setNewUser] = useState({ name: '', email: '', role: '' });

  // Hàm lấy dữ liệu người dùng từ Firestore
  const fetchUsers = async () => {
    try {
      const usersCollection = collection(firestore, 'users'); // Lấy dữ liệu từ Firestore
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        role: doc.data().role || '', // Lưu vai trò của người dùng
        status: 'offline', // Mặc định trạng thái là offline
      }));
  
      // Cập nhật trạng thái online/offline cho từng user
      usersList.forEach(user => {
        const userStatusRef = ref(database, `status/${user.id}`);
        onValue(userStatusRef, (snapshot) => {
          const status = snapshot.val() || { state: 'offline', last_changed: null }; // Mặc định nếu không có giá trị
          user.status = status.state;
          user.lastLogin = status.last_changed ? new Date(status.last_changed).toLocaleString() : 'Chưa có'; // Cập nhật thời gian đăng nhập cuối cùng
          setUsers(prevUsers => [...prevUsers]); // Cập nhật lại state
        });
      });
  
      setUsers(usersList);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
    }
  };

  // Hàm bật/tắt popup thêm người dùng
  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  // Xử lý gửi form để thêm người dùng
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    try {
        // Gọi hàm thêm người dùng
        await addUser(newUser.email, newUser.name, newUser.role);
        alert("Người dùng được thêm thành công!");

        // Đóng popup sau khi thêm thành công
        togglePopup();
        setNewUser({ name: '', email: '', role: '' }); // Reset form

        // Gọi fetchUsers sau khi hoàn thành việc thêm người dùng
        await fetchUsers(); // Reload danh sách người dùng
    } catch (error) {
        alert("Có lỗi khi thêm người dùng: " + error.message);
    }
};
  

  // Bật/tắt chế độ chỉnh sửa
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  // Hàm xóa người dùng
  const handleDeleteUser = async (userId) => {
    try {
        const response = await fetch('http://localhost:5001/api/deleteUser', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: userId }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log(data.message);
        fetchUsers(); // Reload danh sách người dùng
    } catch (error) {
        console.error('Error deleting user:', error);
    }
};


  useEffect(() => {
    const fetchData = async () => {
      await fetchUsers();
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold">Danh sách người dùng</h2>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className='flex justify-between mb-4'>
          <button onClick={togglePopup} className="bg-primary text-white p-2 rounded">
            Thêm người dùng mới
          </button>
          <button 
            onClick={handleEditToggle} 
            className="bg-gray-500 text-white p-2 rounded ml-4"
          >
            {isEditing ? 'Thoát' : 'Chỉnh sửa'}
          </button>
        </div>
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="min-w-full table-auto bg-white rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold">Tên người dùng</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold">Email</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold">Vai trò</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold">Trạng thái</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold">Đăng nhập lần cuối</th>
                {isEditing && <th className="py-4 px-6 text-left text-gray-600 font-semibold"></th>} {/* Cột xóa */}
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className={`hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-4 px-6">{user.name}</td>
                  <td className="py-4 px-6">{user.email}</td>
                  <td className="py-4 px-6">{user.role}</td>
                  <td className="py-4 px-6 font-semibold flex items-center">
                    {user.status === 'online' ? (
                      <div className='flex items-center px-2 py-1 rounded-full font-semibold text-sm bg-green-200'>
                        <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> 
                        <span>Online</span>
                      </div>
                    ) : (
                      <div className='flex items-center px-2 py-1 rounded-full font-semibold text-sm bg-red-200'>
                        <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                        <span>Offline</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 font-regular italic text-gray-500">{user.lastLogin}</td>
                  {isEditing && (
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => handleDeleteUser(user.id)} 
                        className="text-red-500 hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Popup thêm người dùng */}
      <Popup isOpen={isPopupOpen} onClose={togglePopup}>
        <h2 className="text-xl font-bold mb-4">Thêm người dùng mới</h2>
        <form onSubmit={handleAddUserSubmit}>
          <div>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
              className="border border-gray-300 p-2 mb-4 w-full rounded-lg"
              placeholder='Nhập email'
            />
          </div>
          <div>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              required
              className="border border-gray-300 p-2 mb-4 w-full rounded-lg"
              placeholder='Nhập họ & tên'
            />
          </div>
          <div>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              required
              className="border border-gray-300 p-2 mb-12 w-full rounded-lg"
            >
              <option value="" disabled>Chọn vai trò</option> {/* Mặc định không chọn */}
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={togglePopup} className="bg-gray-500 text-white p-2 rounded mr-2">
              Hủy
            </button>
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">
              Thêm người dùng
            </button>
          </div>
        </form>
      </Popup>
    </div>
  );
};

export default Team;
