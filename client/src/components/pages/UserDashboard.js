import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../firebase';
import CircleChart from '../CircleChart';
import TaskCalendarUser from '../pages/TaskCalendarUser'

const UserDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [newLoginDuration, setNewLoginDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [metrics, setMetrics] = useState({
    kpi: 0,
    realKpi: 0,
    completionPercentage: 0,
    latePercentage: 0,
    totalTasks: 0,
  });

  const kpiPoints = {
    "Thiết kế": 10,
    "Content": 10,
    "Chụp/Quay": 20,
    "Xử lí ảnh": 10,
    "Kế hoạch": 15,
    "Edit video": 15,
    "Website": 50
  };

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  // Lấy danh sách công việc từ Firestore
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

  // Lấy thời gian đăng nhập từ Firestore
  const fetchNewLoginDuration = async () => {
    setLoading(true);
    try {
      const monthFormatted = `${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;
      const durationRef = doc(firestore, `users/${uid}/loginRecords/${monthFormatted}`);
      const durationDoc = await getDoc(durationRef);

      if (durationDoc.exists()) {
        let loginDuration = durationDoc.data().loginDuration || 0.0;
        loginDuration = (loginDuration / 3600).toFixed(2); // Quy đổi sang giờ
        setNewLoginDuration(parseFloat(loginDuration));
      } else {
        setNewLoginDuration(0.0);
      }
    } catch (error) {
      console.error("Lỗi khi lấy newLoginDuration:", error);
    } finally {
      setLoading(false);
    }
  };

  // Lọc công việc theo tháng và năm
  const getUserTasks = () => {
    return tasks.filter(task => {
      const deadline = task.deadline?.toDate();
      if (!deadline) return false;

      return task.assignedTo === uid &&
        deadline.getMonth() + 1 === selectedMonth &&
        deadline.getFullYear() === selectedYear;
    });
  };

  // Tính toán các chỉ số KPI
const calculateMetrics = () => {
    const userTasks = getUserTasks();
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(task => task.status === "Hoàn Thành").length;
    const lateTasks = userTasks.filter(task => task.progressStatus === "Trễ tiến độ").length;

    // Khởi tạo kpi và realKpi tổng
    const { kpi, realKpi } = userTasks.reduce((acc, task) => {
        const taskKpi = kpiPoints[task.type] || 0;
        acc.kpi += taskKpi;

        if (task.status === "Hoàn Thành") {
            const progressPoints = task.progressStatus === "Đúng tiến độ" ? taskKpi : taskKpi * 0.5;
            acc.realKpi += progressPoints;
        }

        return acc;
    }, { kpi: 0, realKpi: 0 });

    // Tính toán phần trăm hoàn thành và trễ
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const latePercentage = totalTasks > 0 ? (lateTasks / totalTasks) * 100 : 0;

    // Thống kê từng loại công việc
    const taskTypeMetrics = userTasks.reduce((acc, task) => {
        const taskKpi = kpiPoints[task.type] || 0;

        if (!acc[task.type]) {
            acc[task.type] = {
                total: 0,
                completed: 0,
                late: 0,
                kpi: 0,
                realKpi: 0
            };
        }

        acc[task.type].total += 1;
        acc[task.type].kpi += taskKpi;

        if (task.status === "Hoàn Thành") {
            acc[task.type].completed += 1;
            const progressPoints = task.progressStatus === "Đúng tiến độ" ? taskKpi : taskKpi * 0.5;
            acc[task.type].realKpi += progressPoints;
        }

        if (task.progressStatus === "Trễ tiến độ") {
            acc[task.type].late += 1;
        }

        return acc;
    }, {});

    // Biến đổi taskTypeMetrics để tính phần trăm cho từng loại
    const detailedMetrics = Object.entries(taskTypeMetrics).map(([type, metrics]) => ({
        type,
        ...metrics,
        completionPercentage: metrics.total > 0 ? (metrics.completed / metrics.total) * 100 : 0,
        latePercentage: metrics.total > 0 ? (metrics.late / metrics.total) * 100 : 0
    }));

    setMetrics({
        kpi,
        realKpi,
        completionPercentage,
        latePercentage,
        totalTasks,
        detailedMetrics
    });
};


  // Fetch data khi khởi chạy
  useEffect(() => {
    const fetchData = async () => {
      if (uid) {
        await fetchTasks();
        await fetchNewLoginDuration();
      }
    };
    fetchData();
  }, [uid]);

  // Tính toán lại khi danh sách công việc hoặc tháng/năm thay đổi
  useEffect(() => {
    calculateMetrics();
  }, [tasks, selectedMonth, selectedYear]);

  // Xử lý thay đổi tháng
  const handleMonthChange = (event) => {
    setSelectedMonth(Number(event.target.value));
  };

  // Xử lý thay đổi năm
  const handleYearChange = (event) => {
    setSelectedYear(Number(event.target.value));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 bg-white p-6 rounded-lg shadow-md w-full">
        <div>
          <h1 className='text-4xl text-primary font-bold mb-2'>Tổng quan công việc</h1>
          <p className='text-gray-600'>tháng {selectedMonth} năm {selectedYear}</p>
        </div>
        <div>
          <label className="mr-2">Tháng</label>
          <select value={selectedMonth} onChange={handleMonthChange} className="border p-2">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <label className="ml-4 mr-2">Năm</label>
          <select value={selectedYear} onChange={handleYearChange} className="border p-2">
            {Array.from({ length: 5 }, (_, i) => (
              <option key={selectedYear - i} value={selectedYear - i}>
                {selectedYear - i}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-6">
        <div className="bg-white border p-6 rounded-lg shadow-lg">
          <h1 className="text-left text-gray-600 font-semibold">Công việc</h1>
          <p className='mt-2 font-bold text-6xl text-primary-400'>{metrics.totalTasks}</p>
        </div>
        <div className="bg-white border p-6 rounded-lg shadow-lg flex-col">
          <div>
            <h1 className="text-left text-gray-600 font-semibold">KPI đạt được</h1>
            <p className='mt-2 font-bold text-6xl'>{metrics.realKpi}</p>
          </div>
          <div>
            <p className='flex justify-end text-gray-400'> trên tổng {metrics.kpi}</p>
          </div>
        </div>
        <div className="bg-white border p-6 rounded-lg shadow-lg col-span-3 flex">
          <div>
            <h1 className="text-left text-gray-600 font-semibold">% Hoàn thành</h1>
            <p className='mt-2 font-bold text-6xl text-green-500'>{metrics.completionPercentage.toFixed(2)}%</p>
          </div>
          <div className='align-middle'>
            <CircleChart 
              completionPercentage={metrics.completionPercentage}
              labelComplete="Hoàn thành"
              labelIncomplete="Chưa hoàn thành"
              completeColor="#45B75E"   // Màu xanh lá cho phần hoàn thành
              incompleteColor="#f1f1f1" // Màu xám cho phần chưa hoàn thành
              className="w-54 h-54 bg-white rounded-lg "
            />
          </div>
        </div>
        <div className="bg-white border p-6 rounded-lg shadow-lg col-span-3 flex">
          <div>
            <h1 className="text-left text-gray-600 font-semibold">% Trễ tiến độ</h1>
            <p className='mt-2 font-bold text-6xl text-red-500'>{metrics.latePercentage.toFixed(2)}%</p>
          </div>
          <div>
          <CircleChart 
              completionPercentage={metrics.latePercentages}
              labelComplete="% Trễ"
              labelIncomplete="Đúng tiến độ"
              completeColor="#FF0000"   // Màu xanh lá cho phần hoàn thành
              incompleteColor="#f1f1f1" // Màu xám cho phần chưa hoàn thành
              className="w-54 h-54 bg-white rounded-lg "
            />
          </div>
        </div>
        <div className='col-span-8 row-span-3'>
          <TaskCalendarUser/>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
