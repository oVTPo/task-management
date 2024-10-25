import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase'; // Thay đổi đường dẫn nếu cần

const Reports = () => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Tháng hiện tại (1-12)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Năm hiện tại

  // Điểm KPI cho từng loại công việc
  const kpiPoints = {
    "Thiết kế": 10,
    "Content": 10,
    "Chụp/Quay": 20,
    "Xử lí ảnh": 10,
    "Kế hoạch": 15,
    "Edit video": 15,
    "Website": 50
  };

  // Hàm lấy danh sách người dùng từ Firestore
  const fetchUsers = async () => {
    try {
      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name // Giả sử bạn có trường `name` trong document
      }));

      setUsers(usersList);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
    }
  };

  // Hàm lấy danh sách công việc từ Firestore
  const fetchTasks = async () => {
    try {
      const tasksCollection = collection(firestore, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      const tasksList = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() // Lấy toàn bộ dữ liệu công việc
      }));

      setTasks(tasksList);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách công việc:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchUsers();
      await fetchTasks();
      setLoading(false); // Đặt loading thành false sau khi hoàn tất tất cả các fetch
    };

    fetchData();
  }, []);

  // Hàm để lấy công việc của người dùng theo UID và tháng/năm
  const getUserTasks = (userId) => {
    return tasks.filter(task => {
      const deadline = task.deadline?.toDate(); // Chuyển đổi timestamp thành đối tượng Date
      return task.assignedTo === userId && 
             deadline.getMonth() + 1 === selectedMonth && // Kiểm tra tháng
             deadline.getFullYear() === selectedYear; // Kiểm tra năm
    });
  };

  // Hàm tính tổng KPI, số công việc, % Hoàn thành, và % Trễ cho mỗi người dùng
  const calculateMetricsByUserId = (userId) => {
    const userTasks = getUserTasks(userId);
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(task => task.status === "Hoàn Thành").length;
    const lateTasks = userTasks.filter(task => task.progressStatus === "Trễ tiến độ").length;

    const { kpi, realKpi } = userTasks.reduce((acc, task) => {
      const kpi = kpiPoints[task.type] || 0; // Lấy điểm KPI nếu loại công việc hợp lệ
      acc.kpi += kpi; // Cộng dồn KPI

      // Tính KPI thực tế
      if (task.status === "Hoàn Thành") {
        const progressPoints = task.progressStatus === "Đúng tiến độ" ? kpi : kpi * 0.5; // 100% hoặc 50% điểm
        acc.realKpi += progressPoints; // Cộng dồn KPI thực tế
      }

      return acc;
    }, { kpi: 0, realKpi: 0 }); // Trả về object chứa tổng KPI và KPI thực tế

    // Tính % Hoàn thành và % Trễ
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0; // Tính phần trăm hoàn thành
    const latePercentage = totalTasks > 0 ? (lateTasks / totalTasks) * 100 : 0; // Tính phần trăm trễ

    return { kpi, realKpi, completionPercentage, latePercentage, totalTasks }; // Trả về object chứa tổng KPI, KPI thực tế, % Hoàn thành, % Trễ và số công việc
  };

  // Hàm để thay đổi tháng
  const handleMonthChange = (event) => {
    setSelectedMonth(Number(event.target.value)); // Cập nhật tháng đã chọn
  };

  // Hàm để thay đổi năm
  const handleYearChange = (event) => {
    setSelectedYear(Number(event.target.value)); // Cập nhật năm đã chọn
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
            {/* Ví dụ năm từ 2020 đến 2030 */}
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
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const metrics = calculateMetricsByUserId(user.id); // Lấy số liệu cho người dùng
                return (
                  <tr key={user.id} className={`hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-4 px-6 font-bold">{user.name}</td>
                    <td className="py-4 px-6">{metrics.totalTasks}</td>
                    <td className="py-4 px-6">{metrics.kpi}</td>
                    <td className="py-4 px-6">{metrics.realKpi}</td> {/* Hiển thị KPI thực tế */}
                    <td className="py-4 px-6">
                        <div className="relative w-full flex items-center"> {/* Hiển thị % Trễ */}
                            <span className="text-sm font-semibold pr-2">{metrics.latePercentage.toFixed(2)}%</span>
                            <div className="bg-gray-200 h-2 rounded flex-1"> {/* Thanh nền */}
                                <div
                                className="bg-red-300 h-full rounded"
                                style={{ width: `${metrics.latePercentage}%` }} // Đảm bảo chiều rộng của thanh màu xanh lá
                                />
                            </div>
                        </div>
                    </td>
                    <td className="py-4 px-6">
                        <div className="relative w-full flex items-center">
                            <span className="text-sm font-semibold pr-2">{metrics.completionPercentage.toFixed(2)}%</span>
                            <div className="bg-gray-200 h-2 rounded flex-1"> {/* Thanh nền */}
                                <div
                                className="bg-green-300 h-full rounded"
                                style={{ width: `${metrics.completionPercentage}%` }} // Đảm bảo chiều rộng của thanh màu xanh lá
                                />
                            </div>
                        </div>
                    </td>
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
