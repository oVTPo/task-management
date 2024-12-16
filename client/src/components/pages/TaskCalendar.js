import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import viLocale from '@fullcalendar/core/locales/vi'; // Import ngôn ngữ tiếng Việt
import Loading from '../Loading';

const TaskCalendar = ({ isToday = false, viewMode = "listMonth", showViewButtons = true }) => {
  const [events, setEvents] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // Tất cả nhiệm vụ
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Tất cả"); // Bộ lọc trạng thái
  const [userFilter, setUserFilter] = useState("Tất cả"); // Bộ lọc người dùng
  const [userList, setUserList] = useState([]);

  const getUserName = async (uid) => {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data().name : "Không có tên";
  };

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // Lấy danh sách người dùng
        const userQuery = query(collection(db, "users"), where("role", "==", "user"));
        const userSnapshot = await getDocs(userQuery);
        const validUserIds = userSnapshot.docs.map((doc) => doc.id);
        const userMap = {};
        userSnapshot.docs.forEach((doc) => {
          userMap[doc.id] = doc.data().name;
        });
        setUserList(["Tất cả", ...Object.values(userMap)]);

        // Lấy tất cả task
        const taskQuery = collection(db, "tasks");
        const querySnapshot = await getDocs(taskQuery);
        const taskPromises = querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          if (validUserIds.includes(data.assignedTo)) {
            const userName = userMap[data.assignedTo] || "Không có tên";
            const formattedDate =
              data.deadline && data.deadline.seconds
                ? new Date(data.deadline.seconds * 1000)
                : null;

            return {
              title: `${data.name || "Không có tên nhiệm vụ"} - ${userName}`,
              start: formattedDate ? formattedDate.toISOString() : null,
              extendedProps: {
                taskName: data.name || "Không có tên nhiệm vụ",
                userName,
                status: data.status || "Chưa có trạng thái",
              },
            };
          }
          return null;
        });

        const tasks = await Promise.all(taskPromises);
        const validTasks = tasks.filter((task) => task && task.start !== null);
        setAllTasks(validTasks);
        setEvents(validTasks);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Hàm lọc dữ liệu
  const applyFilter = () => {
    let filteredEvents = allTasks;

    if (statusFilter !== "Tất cả") {
      filteredEvents = filteredEvents.filter(
        (task) => task.extendedProps.status === statusFilter
      );
    }

    if (userFilter !== "Tất cả") {
      filteredEvents = filteredEvents.filter(
        (task) => task.extendedProps.userName === userFilter
      );
    }

    setEvents(filteredEvents);
  };

  useEffect(() => {
    applyFilter();
  }, [statusFilter, userFilter]);

  return (
    <div className="bg-gray-100">
      {/* Bộ lọc */}
      <div className="bg-white shadow-lg rounded-lg p-4 mb-4 flex gap-4">
        {/* Lọc trạng thái */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded w-full"
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Mới">Mới</option>
            <option value="Sửa lại">Sửa lại</option>
            <option value="Hoàn Thành">Hoàn thành</option>
          </select>
        </div>
        {/* Lọc người dùng */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Người dùng</label>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="p-2 border rounded w-full"
          >
            {userList.map((user, index) => (
              <option key={index} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        {loading ? ( // Hiển thị spinner hoặc thông báo loading khi dữ liệu đang tải
          <Loading/>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, listPlugin, timeGridPlugin]}
            initialView={viewMode}
            locale="vi"
            headerToolbar={showViewButtons ? {
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
            } : {
              left: 'prev,next today',
              center: 'title',
              right: 'listMonth',
            }}
            events={events}
            eventContent={(eventInfo) => {
              const { taskName, userName, time, status } = eventInfo.event.extendedProps;
              const taskCardClass = status === 'Hoàn Thành' ? 'bg-green-200' : 'bg-gray-50';
              const titleTextClass = status === 'Hoàn Thành' ? 'text-green-600' : 'text-blue-600';
              const truncatedTaskName = taskName.length > 28 ? taskName.slice(0, 20) + "..." : taskName;

              return (
                <div className={`flex flex-col p-2 space-y-1 border-2 rounded-lg shadow-md ${taskCardClass}`}>
                  <div className={`font-semibold text-md ${titleTextClass}`}>{truncatedTaskName}</div>
                  <div className="text-sm text-gray-700">{userName}</div>
                  <div className="text-sm text-gray-500">{time}</div>
                </div>
              );
            }}
            buttonText={{
              today: 'Hôm nay',
              month: 'Tháng',
              week: 'Tuần',
              day: 'Ngày',
              listMonth: 'Danh sách',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TaskCalendar;
