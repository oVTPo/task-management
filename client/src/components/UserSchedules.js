import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid"; 
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";


const UserSchedules = () => {
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);
  const [hoveredInfo, setHoveredInfo] = useState([]); // Lưu trữ mảng các dòng thông tin
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 }); // Vị trí tooltip
  const db = getFirestore();

  // Hàm tải dữ liệu người dùng và lịch làm việc
  const loadSchedules = async () => {
    try {
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef, where("role", "==", "user"));
      const userSnapshots = await getDocs(usersQuery);

      const calendarEvents = [];
      const userResources = [];

      // Tạo tài nguyên người dùng
      for (const userDoc of userSnapshots.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const userName = userData.name || "Không có tên";
        
        userResources.push({
          id: userId,
          title: userName, // Người dùng là tài nguyên
        });

        // Tải lịch làm việc cho mỗi người dùng
        const schedulesRef = collection(db, `users/${userId}/workSchedules`);
        const scheduleSnapshots = await getDocs(schedulesRef);

        for (const scheduleDoc of scheduleSnapshots.docs) {
          const scheduleData = scheduleDoc.data();

          for (const [date, timeSlots] of Object.entries(scheduleData.days)) {
            for (const slot of timeSlots) {
              calendarEvents.push({
                resourceId: userId, // Gắn tài nguyên (người dùng)
                title: `${userName}\n${slot.status || "Không có trạng thái"}\n${slot.start} - ${slot.end}`,
                start: `${date}T${slot.start}`, // Ngày + giờ bắt đầu
                end: `${date}T${slot.end}`, // Ngày + giờ kết thúc
                extendedProps: { status: slot.status || "offline", userName },
              });
            }
          }
        }
      }

      setEvents(calendarEvents); // Cập nhật sự kiện vào state
      setResources(userResources); // Cập nhật tài nguyên vào state
    } catch (error) {
      console.error("Lỗi khi tải lịch làm việc:", error);
    }
  };

  // Dùng useEffect để gọi hàm loadSchedules khi component được mount
  useEffect(() => {
    loadSchedules();
  }, []);

  // Xử lý sự kiện khi rê chuột vào sự kiện
  const handleMouseEnter = (info) => {
    const userName = info.event.extendedProps.userName; 
    const startTime = info.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = info.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const status = info.event.extendedProps.status;
    
    // Tạo một mảng với các dòng
    setHoveredInfo([
      userName,
      status,
      `Thời gian: ${startTime} - ${endTime}`,
    ]);

    // Tính toán vị trí của chuột trên màn hình
    const tooltipLeft = info.jsEvent.pageX + 10; // Thêm khoảng cách
    const tooltipTop = info.jsEvent.pageY + 10; // Thêm khoảng cách
    setTooltipPosition({ left: tooltipLeft, top: tooltipTop });
  };

  const handleMouseLeave = () => {
    setHoveredInfo([]); // Xóa thông tin khi không còn rê chuột vào sự kiện
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl text-primary font-bold mb-4">Lịch làm việc</h1>
      
      {/* Hiển thị tooltip ở vị trí chuột */}
      {hoveredInfo.length > 0 && (
        <div
          className="tooltip"
          style={{
            left: `${tooltipPosition.left}px`,
            top: `${tooltipPosition.top}px`,
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {/* Render các dòng trong mảng hoveredInfo */}
          {hoveredInfo.map((line, index) => (
            <div key={index} className="mb-1">{line}</div>
          ))}
        </div>
      )}

      <FullCalendar
        plugins={[timeGridPlugin, resourceTimeGridPlugin]} // Sử dụng plugin timeGrid và resource-timegrid
        initialView="resourceTimeGridWeek" // Dạng tuần với các cột người dùng
        events={events} // Sự kiện
        resources={resources} // Tài nguyên (người dùng)
        headerToolbar={{
          start: "prev,next today", // Các nút điều hướng
          center: "title", // Tiêu đề
          end: "resourceTimeGridDay,resourceTimeGridWeek", // Chế độ xem ngày/tuần
        }}
        allDaySlot={false} // Loại bỏ ô "All Day"
        slotMinTime="06:00:00" // Giờ bắt đầu trong ngày
        slotMaxTime="22:00:00" // Giờ kết thúc trong ngày
        locale="vi" // Ngôn ngữ Tiếng Việt


        eventDateFormat={{
          weekday: 'short',   // Tên thứ trong tuần viết tắt (ví dụ: "T2" cho Thứ Hai)
          day: 'numeric',     // Ngày trong tháng (ví dụ: "1")
          month: 'numeric',   // Tháng (ví dụ: "12")
        }}
        
        nowIndicator={true} 
        eventContent={(arg) => {
          const { event } = arg;
          const [name, status, time] = event.title.split("\n");

          return (
            <div className={`flex flex-col p-2 rounded-md shadow-sm`}>
            </div>
          );
        }}
        eventClassNames={(arg) => {
          if (arg.event.extendedProps.status === "online") {
            return "bg-yellow-300 text-yellow"; 
          } else if (arg.event.extendedProps.status === "offline") {
            return "bg-primary-200 text-primary"; 
          }
          return ""; 
        }}
        height="auto"
        contentHeight="auto"
        eventMouseEnter={handleMouseEnter} // Thêm sự kiện khi rê chuột vào
        eventMouseLeave={handleMouseLeave} // Thêm sự kiện khi rê chuột ra
      />
      <div className="mt-4 flex items-center justify-evenly">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-primary-200 mr-2"></div>
          <h2>Giờ Offline</h2>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-300 mr-2"></div>
          <h2 className="font-normal text-base">Giờ Online</h2>
        </div>
      </div>
    </div>
  );
};

export default UserSchedules;
