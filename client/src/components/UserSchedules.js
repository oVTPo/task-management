import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

const UserSchedules = () => {
  const [events, setEvents] = useState([]); // Lưu danh sách sự kiện cho FullCalendar
  const db = getFirestore();

  // Hàm tải dữ liệu từ Firestore
  const loadSchedules = async () => {
    try {
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef, where("role", "==", "user"));
      const userSnapshots = await getDocs(usersQuery);

      const calendarEvents = [];

      // Lặp qua từng người dùng để lấy lịch làm việc
      for (const userDoc of userSnapshots.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const userName = userData.name || "Không có tên";

        // Lấy subcollection `workSchedules`
        const schedulesRef = collection(db, `users/${userId}/workSchedules`);
        const scheduleSnapshots = await getDocs(schedulesRef);

        scheduleSnapshots.forEach((scheduleDoc) => {
            const scheduleData = scheduleDoc.data();
          
            // Lặp qua từng ngày và khung giờ
            for (const [date, timeSlots] of Object.entries(scheduleData.days)) {
              timeSlots.forEach((slot) => {
                calendarEvents.push({
                  title: `${userName}\n${slot.status || "Không có trạng thái"}\n${slot.start} - ${slot.end}`, // Hiển thị tên, trạng thái và thời gian
                  start: `${date}T${slot.start}`, // Ngày + giờ bắt đầu
                  end: `${date}T${slot.end}`, // Ngày + giờ kết thúc
                  extendedProps: { status: slot.status || "offline" } // Thêm trạng thái vào extendedProps
                });
              });
            }
          });
          
      }

      setEvents(calendarEvents); // Lưu sự kiện vào state
    } catch (error) {
      console.error("Lỗi khi tải lịch làm việc:", error);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className='text-2xl text-primary-400 font-bold mb-4'>Lịch làm việc</h1>
        <FullCalendar
            plugins={[timeGridPlugin]} // Sử dụng plugin timeGrid
            initialView="timeGridWeek" // Hiển thị dạng lịch tuần
            events={events} // Truyền dữ liệu sự kiện
            headerToolbar={{
            start: "prev,next today", // Các nút điều hướng
            center: "title", // Tiêu đề
            end: "timeGridDay,timeGridWeek", // Chế độ xem ngày/tuần
            }}
            allDaySlot={false} // Loại bỏ ô "All Day"
            slotMinTime="06:00:00" // Giờ bắt đầu trong ngày
            slotMaxTime="22:00:00" // Giờ kết thúc trong ngày
            locale="vi" // Đặt ngôn ngữ thành tiếng Việt

            // Tùy chỉnh giao diện sự kiện
            eventContent={(arg) => {
            const { event } = arg;
            const [name, status, time] = event.title.split("\n");

            // Tùy chỉnh giao diện bằng Tailwind CSS
            return (
                <div className={`flex flex-col p-2 rounded-md shadow-sm ${
                event.extendedProps.status === "online" 
                ? "text-yellow-800" // Màu văn bản cho trạng thái online
                : "text-primary-800" // Màu văn bản cho trạng thái offline
                }`}>
                <div className="text-sm font-semibold">{name}</div> {/* Tên người dùng */}
                <div className={`text-xs mt-1 italic ${status === "online" ? "text-yellow-800" : "text-primary-800"}`}>
                    {status}
                </div> {/* Trạng thái, đổi màu theo Online/Offline */}
                <div className="text-xs font-semibold  text-gray-900 mt-1">{time}</div> {/* Thời gian */}
                </div>
            );
            }}

            // Thêm lớp CSS cho toàn bộ sự kiện (chẳng hạn thay đổi màu nền theo trạng thái)
            eventClassNames={(arg) => {
                    if (arg.event.extendedProps.status === "online") {
                        return "bg-yellow-200 text-white"; // Màu nền vàng cho trạng thái online
                    } else if (arg.event.extendedProps.status === "offline") {
                        return "bg-primary-200 text-primary"; // Màu nền primary cho trạng thái offline
                    }
                    return ""; // Màu nền mặc định
                }}
            height="auto"  // Tự động điều chỉnh chiều cao
            contentHeight="auto" // Đảm bảo phần nội dung tự động thay đổi chiều cao
      />
    </div>
  );
};

export default UserSchedules;
