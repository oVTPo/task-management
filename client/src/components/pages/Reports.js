import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';

const Reports = () => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newLoginDurations, setNewLoginDurations] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const kpiPoints = {
    "Thiết kế": 10,
    "Content": 10,
    "Chụp/Quay": 20,
    "Xử lí ảnh": 10,
    "Kế hoạch": 15,
    "Edit video": 15,
    "Website": 50
  };

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));

      setUsers(usersList);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const tasksCollection = collection(firestore, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      const tasksList = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTasks(tasksList);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách công việc:", error);
    }
  };

  const fetchNewLoginDurations = async () => {
    setLoading(true); // Bắt đầu tải dữ liệu
    try {
      const monthFormatted = `${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;
      const usersWithDurations = {};

      for (const user of users) {
        const uid = user.id;
        const durationRef = doc(firestore, `users/${uid}/loginRecords/${monthFormatted}`);
        const durationDoc = await getDoc(durationRef);
        
        if (durationDoc.exists()) {
          let loginDuration = durationDoc.data().loginDuration || 0.0;
          loginDuration = (loginDuration / 3600).toFixed(2);
          usersWithDurations[uid] = parseFloat(loginDuration);
        } else {
          usersWithDurations[uid] = 0.00;
        }
      }

      setNewLoginDurations(usersWithDurations);
    } catch (error) {
      console.error("Lỗi khi lấy newLoginDuration:", error);
    } finally {
      setLoading(false); // Kết thúc tải dữ liệu
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchUsers();
      await fetchTasks();
      await fetchNewLoginDurations();
    };

    fetchData();
  }, []);

  useEffect(() => {
    fetchNewLoginDurations();
  }, [selectedMonth, selectedYear, users]); // Thêm users vào mảng phụ thuộc

  const getUserTasks = (userId) => {
    return tasks.filter(task => {
      const deadline = task.deadline?.toDate();
      if (!deadline) return false;

      return task.assignedTo === userId && 
             deadline.getMonth() + 1 === selectedMonth && 
             deadline.getFullYear() === selectedYear;
    });
  };

  const calculateMetricsByUserId = (userId) => {
    const userTasks = getUserTasks(userId);
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(task => task.status === "Hoàn Thành").length;
    const lateTasks = userTasks.filter(task => task.progressStatus === "Trễ tiến độ").length;

    const { kpi, realKpi } = userTasks.reduce((acc, task) => {
      const kpi = kpiPoints[task.type] || 0;
      acc.kpi += kpi;

      if (task.status === "Hoàn Thành") {
        const progressPoints = task.progressStatus === "Đúng tiến độ" ? kpi : kpi * 0.5;
        acc.realKpi += progressPoints;
      }

      return acc;
    }, { kpi: 0, realKpi: 0 });

    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const latePercentage = totalTasks > 0 ? (lateTasks / totalTasks) * 100 : 0;

    return { kpi, realKpi, completionPercentage, latePercentage, totalTasks };
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(Number(event.target.value));
  };

  const handleYearChange = (event) => {
    setSelectedYear(Number(event.target.value));
  };

  return (
    <div className="p-8 bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Thống kê hiệu suất</h2>
        
        <div className="flex">
          <select onChange={handleMonthChange} value={selectedMonth} className="mr-4">
            {[...Array(12).keys()].map(month => (
              <option key={month} value={month + 1}>{new Date(0, month).toLocaleString('vi-VN', { month: 'long' })}</option>
            ))}
          </select>

          <select onChange={handleYearChange} value={selectedYear}>
            {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="min-w-full h-full table-auto bg-white rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/6">Tên người dùng</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/12">Số công việc</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/12">KPI công việc</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/12">KPI thực tế</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/5">% Trễ</th>
                <th className="py-4 px-6 text-left text-gray-600 font-semibold w-1/5">% Hoàn thành</th>
                <th className="py-4 px-6 text-center text-gray-600 font-semibold w-1/12">Thời gian đăng nhập (giờ)</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const metrics = calculateMetricsByUserId(user.id);
                return (
                  <tr key={user.id} className={`hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-4 px-6 font-bold">{user.name}</td>
                    <td className="py-4 px-6">{metrics.totalTasks}</td>
                    <td className="py-4 px-6">{metrics.kpi}</td>
                    <td className="py-4 px-6">{metrics.realKpi}</td>
                    <td className="py-4 px-6">
                      <div className="relative w-full flex items-center">
                        <span className="text-sm font-semibold pr-2">{metrics.latePercentage.toFixed(2)}%</span>
                        <div className="relative w-full h-2 bg-gray-300 rounded-full">
                          <div className="absolute left-0 top-0 h-full bg-red-500 rounded-full" style={{ width: `${metrics.latePercentage}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="relative w-full flex items-center">
                        <span className="text-sm font-semibold pr-2">{metrics.completionPercentage.toFixed(2)}%</span>
                        <div className="relative w-full h-2 bg-gray-300 rounded-full">
                          <div className="absolute left-0 top-0 h-full bg-green-500 rounded-full" style={{ width: `${metrics.completionPercentage}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">{newLoginDurations[user.id] || 0.00}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;
