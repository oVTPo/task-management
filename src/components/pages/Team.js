import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore, database } from '../../firebase'; 
import { ref, onValue } from 'firebase/database';
import { addUser } from '../../utils/addUser'; // Import hàm thêm người dùng
import { auth } from '../../firebase'; // Import auth

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: '' }); // Không cần trường password
  const [isEditing, setIsEditing] = useState(false); // State để kiểm soát chế độ chỉnh sửa

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
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prevUser => ({ ...prevUser, [name]: value })); // Cập nhật state người dùng mới
  };

  const handleAddUser = async (e) => {
    e.preventDefault(); // Ngăn chặn reload trang
    await addUser({ ...newUser }); // Gọi hàm thêm người dùng
    fetchUsers(); // Cập nhật danh sách người dùng
    setNewUser({ name: '', email: '', role: '' }); // Reset form
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing); // Chuyển đổi chế độ chỉnh sửa
  };

  const handleDeleteUser = (id) => {
    // Thêm logic để xóa người dùng tại đây
    console.log(`Xóa người dùng có ID: ${id}`);
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
        <div className=' flex justify-end'>
          <button 
            onClick={handleEditToggle} 
            className="bg-gray-500 text-white px-4 py-2 rounded-lg mb-4"
          >
            {isEditing ? 'Thoát' : 'Chỉnh sửa'}
          </button>
        </div>
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="min-w-full h-full table-auto bg-white rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/4">Tên người dùng</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/4">Email</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/12">Vai trò</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/12">Trạng thái</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/4">Đăng nhập lần cuối</th>
                {isEditing && <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/24"></th>} {/* Hiện cột xóa khi ở chế độ chỉnh sửa */}
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className={`hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-4 px-6 font-semibold">{user.name}</td>
                  <td className="py-4 px-6 font-regular">{user.email}</td>
                  <td className="py-4 px-6 font-regular">{user.role}</td>
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
                  <td className="py-4 px-6 font-regular italic text-gray-500">{user.lastLogin}</td> {/* Hiển thị thời gian đăng nhập lần cuối */}
                  {isEditing && (
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => handleDeleteUser(user.id)} 
                        className="cursor-pointer px-2 py-1 font-semibold text-sm text-red-700 hover:underline"
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
    </div>
  );
};

export default Team;
