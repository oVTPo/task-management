import React, { useState, useEffect } from 'react';
import { firestore, auth } from '../../firebase'; // Đảm bảo đường dẫn đúng
import { collection, getDocs, addDoc } from 'firebase/firestore';

const CreateTask = () => {
    const [users, setUsers] = useState([]);
    const [taskName, setTaskName] = useState('');
    const [selectedUser, setSelectedUser] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            const usersCollection = collection(firestore, 'users'); // Giả sử bạn có một collection tên là 'users'
            const usersSnapshot = await getDocs(usersCollection);
            const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersList);
        };

        fetchUsers();
    }, []);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!taskName || !selectedUser) {
            alert("Vui lòng điền đầy đủ thông tin nhiệm vụ và chọn người dùng.");
            return;
        }

        try {
            await addDoc(collection(firestore, 'tasks'), {
                name: taskName,
                assignedTo: selectedUser,
                assignedBy: auth.currentUser.displayName || auth.currentUser.email, // Lưu tên hoặc email của người giao
                createdAt: new Date()
            });
            alert("Nhiệm vụ đã được tạo thành công!");
            setTaskName('');
            setSelectedUser('');
        } catch (error) {
            console.error("Lỗi khi tạo nhiệm vụ:", error);
        }
    };


    return (
        <div>
            <h1>Dashboard Admin</h1>
            <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                    <label>Tên Nhiệm Vụ:</label>
                    <input
                        type="text"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        required
                        className="border rounded p-2"
                    />
                </div>
                <div>
                    <label>Giao cho:</label>
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        required
                        className="border rounded p-2"
                    >
                        <option value="">Chọn người dùng</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="bg-blue-600 text-white p-2 rounded">Tạo Nhiệm Vụ</button>
            </form>
        </div>
    );
};

export default CreateTask;
