import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import viLocale from '@fullcalendar/core/locales/vi'; // Import ngôn ngữ tiếng Việt

const TaskCalendar = ({ isToday = false }) => { // Nhận isToday từ props
  const [events, setEvents] = useState([]);

  // Lấy tên người dùng từ UID
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
          
          const userName = await getUserName(data.assignedTo); // Lấy tên người giao nhiệm vụ
          const formattedDate = new Date(data.deadline.seconds * 1000); // Định dạng ngày deadline
          const taskName = data.name || 'Không có tên nhiệm vụ'; // Lấy tên nhiệm vụ
          const formattedTime = formattedDate.toLocaleTimeString(); // Định dạng giờ
          const status = data.status || 'Chưa có trạng thái'; // Lấy trạng thái nhiệm vụ

          return {
            title: `${taskName} - ${userName}`,  // Tiêu đề chứa tên nhiệm vụ và người thực hiện
            start: formattedDate.toISOString(),
            extendedProps: {
              taskName,
              userName,
              time: formattedTime,
              status, // Truyền trạng thái vào extendedProps
            },
          };
        });

        const tasks = await Promise.all(taskPromises);
        
        // Nếu isToday là true, lọc chỉ lấy sự kiện hôm nay
        if (isToday) {
          const today = new Date().toISOString().split('T')[0]; // Lấy ngày hiện tại (YYYY-MM-DD)
          const todayEvents = tasks.filter(event => event.start.split('T')[0] === today);
          setEvents(todayEvents);  // Chỉ set các sự kiện của hôm nay
        } else {
          setEvents(tasks); // Không lọc, lấy tất cả sự kiện
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      }
    };

    fetchTasks();
  }, [isToday]); // Chạy lại mỗi khi isToday thay đổi

  return (
    <div className=" bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <FullCalendar
          plugins={[dayGridPlugin, listPlugin, timeGridPlugin]} // Giữ lại các plugin cần thiết
          initialView="listMonth" // Chế độ xem mặc định là danh sách tháng
          locale="vi" // Ngôn ngữ tiếng Việt
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'listMonth', // Chỉ hiển thị chế độ "listMonth"
          }}
          events={events}
          eventContent={(eventInfo) => {
            const { taskName, userName, time, status } = eventInfo.event.extendedProps;
            
            // Đặt màu nền và màu chữ dựa trên trạng thái
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
