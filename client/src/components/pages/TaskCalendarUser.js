import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase'; // Đảm bảo đã import auth từ firebase.js
import { db } from '../../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import viLocale from '@fullcalendar/core/locales/vi';

const TaskCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userUid, setUserUid] = useState(null);

  // Lấy userUid từ Firebase Authentication
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserUid(user.uid); // Lưu UID của người dùng
    } else {
      console.log('Chưa đăng nhập!');
    }
  }, []);

  // Lấy tên người dùng từ UID (bạn có thể bỏ qua phần này nếu không cần dùng tên người dùng)
  const getTaskType = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);
    return taskDoc.exists() ? taskDoc.data().type : 'Không có loại nhiệm vụ';
  };

  useEffect(() => {
    if (userUid) {
      const fetchTasks = async () => {
        setLoading(true);
        try {
          const querySnapshot = await getDocs(collection(db, 'tasks'));
          const taskPromises = querySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            if (data.assignedTo === userUid) {
              const taskType = data.type || 'Không có loại nhiệm vụ'; 
              const formattedDate = new Date(data.deadline.seconds * 1000);
              const taskName = data.name || 'Không có tên nhiệm vụ';
              const formattedTime = formattedDate.toLocaleTimeString();

              return {
                title: `${taskName} - ${taskType}`,
                start: formattedDate.toISOString(),
                extendedProps: {
                  taskName,
                  taskType,  // Thêm trường taskType vào extendedProps
                  time: formattedTime,
                  status: data.status, // Thêm trường status vào extendedProps
                },
              };
            }
            return null;
          });

          const tasks = (await Promise.all(taskPromises)).filter(task => task !== null);
          setEvents(tasks);
        } catch (error) {
          console.error('Lỗi khi tải dữ liệu:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchTasks();
    }
  }, [userUid]);

  if (loading) {
    return <div className="text-center p-8">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="p-8 bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <FullCalendar
          plugins={[dayGridPlugin, listPlugin]}
          initialView="dayGridMonth"
          locale="vi"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listMonth', // Loại bỏ timeGridWeek
          }}
          events={events}
          eventContent={(eventInfo) => {
            const { taskName, taskType, time, status } = eventInfo.event.extendedProps;
            const truncatedTaskName = taskName.length > 28 ? taskName.slice(0, 20) + "..." : taskName;

            // Đặt màu nền xanh lá và màu chữ xanh cho thẻ nhiệm vụ nếu status là "Hoàn Thành"
            const taskCardClass = status === 'Hoàn Thành' ? 'bg-green-200' : 'bg-gray-50';
            const titleTextClass = status === 'Hoàn Thành' ? 'text-green-600' : 'text-blue-600';

            return (
              <div className={`flex flex-col p-2 space-y-1 border-2 rounded-lg shadow-md ${taskCardClass}`}>
                <div className={`font-semibold text-md ${titleTextClass}`}>{truncatedTaskName}</div>
                <div className="text-sm text-gray-700">{taskType}</div>
                <div className="text-sm text-gray-500">{time}</div>
              </div>
            );
          }}
          buttonText={{
            today: 'Hôm nay',
            month: 'Tháng',
            listMonth: 'Danh sách',
          }}
        />
      </div>
    </div>
  );
};

export default TaskCalendar;
