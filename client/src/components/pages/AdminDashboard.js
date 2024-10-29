import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore, database } from '../../firebase';
import { ref, onValue , } from 'firebase/database';


const AdminDashboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchUsers();
    };
    fetchData();
  }, []);


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

  return (
    <div class="h-full grid gap-6 grid-rows-4 grid-cols-4 grid-flow-col">
      <div className='bg-red-400'>

      </div>
      <div className='col-start-2 row-span-1 bg-red-400'>2</div>
      <div className='col-start-3 col-span-2 bg-red-400'>3</div>
      <div className='row-span-3 col-span-3 bg-red-400'>4</div>
      <div className='row-span-2 col-span-1 bg-white shadow-lg rounded-xl'>
        <table className='m-4'>
          <thead>
            <tr>
              <th className='w-1/3 text-left font-light italic text-gray-600 text-sm'>Người dùng</th>
              <th className='w-1/3 text-left font-light italic text-gray-600 text-sm'>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
                <tr key={user.id} className={`hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-4 px-6">{user.name}</td>
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
                </tr>
            ))}
          </tbody>
        </table>
      </div>
   </div>
  )
}

export default AdminDashboard
