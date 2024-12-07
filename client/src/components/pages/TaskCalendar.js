import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import viLocale from '@fullcalendar/core/locales/vi'; // Import ngôn ngữ tiếng Việt

const TaskCalendar = ({ isToday = false, viewMode = "listMonth", showViewButtons = true }) => {
  const [events, setEvents] = useState([]);

  const getUserName = async (uid) => {
    const userRef = doc(db, 'users', uid); 
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data().name : 'Không có tên';
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tasks'));
        const taskPromises = querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const userName = await getUserName(data.assignedTo);
          const formattedDate = new Date(data.deadline.seconds * 1000);
          const taskName = data.name || 'Không có tên nhiệm vụ';
          const formattedTime = formattedDate.toLocaleTimeString();
          const status = data.status || 'Chưa có trạng thái';

          return {
            title: `${taskName} - ${userName}`,
            start: formattedDate.toISOString(),
            extendedProps: {
              taskName,
              userName,
              time: formattedTime,
              status,
            },
          };
        });

        const tasks = await Promise.all(taskPromises);
        
        if (isToday) {
          const today = new Date().toISOString().split('T')[0];
          const todayEvents = tasks.filter(event => event.start.split('T')[0] === today);
          setEvents(todayEvents);
        } else {
          setEvents(tasks);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      }
    };

    fetchTasks();
  }, [isToday]);

  return (
    <div className="bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <FullCalendar
          plugins={[dayGridPlugin, listPlugin, timeGridPlugin]}
          initialView={viewMode} 
          locale="vi"
          headerToolbar={showViewButtons ? {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',  // Hiển thị tất cả các nút nếu showViewButtons = true
          } : {
            left: 'prev,next today',
            center: 'title',
            right: 'listMonth',  // Chỉ hiển thị chế độ "listMonth" nếu showViewButtons = false
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
      </div>
    </div>
  );
};

export default TaskCalendar;
