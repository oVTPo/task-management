import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid"; 
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const UserSchedules = () => {
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);
  const [hoveredInfo, setHoveredInfo] = useState([]); 
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const db = getFirestore();

  const loadSchedules = async () => {
    try {
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef, where("role", "==", "user"));
      const userSnapshots = await getDocs(usersQuery);

      const calendarEvents = [];
      const userResources = [];

      for (const userDoc of userSnapshots.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const userName = userData.name || "Không có tên";
        
        userResources.push({
          id: userId,
          title: userName,
        });

        const schedulesRef = collection(db, `users/${userId}/workSchedules`);
        const scheduleSnapshots = await getDocs(schedulesRef);

        for (const scheduleDoc of scheduleSnapshots.docs) {
          const scheduleData = scheduleDoc.data();

          for (const [date, timeSlots] of Object.entries(scheduleData.days)) {
            for (const slot of timeSlots) {
              calendarEvents.push({
                resourceId: userId,
                title: `${userName}\n${slot.status || "Không có trạng thái"}\n${slot.start} - ${slot.end}`,
                start: `${date}T${slot.start}`,
                end: `${date}T${slot.end}`,
                extendedProps: { status: slot.status || "offline", userName },
              });
            }
          }
        }
      }

      setEvents(calendarEvents); 
      setResources(userResources); 
    } catch (error) {
      console.error("Lỗi khi tải lịch làm việc:", error);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const exportToPDF = () => {
    const calendarElement = document.getElementById('calendar'); // Lấy phần tử chứa lịch
    
    // Ẩn các phần tử không muốn (như nút tuần, ngày)
    const toolbar = calendarElement.querySelector('.fc-toolbar'); // Lấy thanh công cụ
    if (toolbar) {
      toolbar.style.display = 'none'; // Ẩn thanh công cụ (bao gồm nút tuần, ngày)
    }
  
    // Chụp ảnh từ phần tử FullCalendar
    html2canvas(calendarElement).then((canvas) => {
      const pdf = new jsPDF('landscape', 'mm', 'a4'); // Thiết lập giấy A4 ngang
  
      // Thêm ảnh từ canvas vào PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 20, pdf.internal.pageSize.width - 20, pdf.internal.pageSize.height - 30); // Thêm ảnh vào, điều chỉnh vị trí và kích thước
  
      pdf.save("lichlamviec_phongtruyenthong.pdf"); // Lưu file PDF
  
      // Hiển thị lại thanh công cụ sau khi xuất PDF
      if (toolbar) {
        toolbar.style.display = ''; // Khôi phục lại hiển thị ban đầu
      }
    });
  };
  
  const handleMouseEnter = (info) => {
    const userName = info.event.extendedProps.userName;
    const startTime = info.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = info.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const status = info.event.extendedProps.status;
    
    setHoveredInfo([
      userName,
      status,
      `Thời gian: ${startTime} - ${endTime}`,
    ]);

    const tooltipLeft = info.jsEvent.pageX + 10;
    const tooltipTop = info.jsEvent.pageY + 10;
    setTooltipPosition({ left: tooltipLeft, top: tooltipTop });
  };

  const handleMouseLeave = () => {
    setHoveredInfo([]);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between">
        <h1 className="text-2xl text-primary font-bold mb-4">Lịch làm việc</h1>

        <button 
          onClick={exportToPDF} 
          className="bg-primary text-white py-2 px-4 rounded-lg mb-4"
        >
          Xuất PDF
        </button>
      </div>

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
          {hoveredInfo.map((line, index) => (
            <div key={index} className="mb-1">{line}</div>
          ))}
        </div>
      )}

      <div id="calendar">
        <FullCalendar
          plugins={[timeGridPlugin, resourceTimeGridPlugin]}
          initialView="resourceTimeGridWeek"
          events={events}
          resources={resources}
          headerToolbar={{
            start: "prev,next today",
            center: "title",
            end: "resourceTimeGridDay,resourceTimeGridWeek",
          }}
          allDaySlot={false}
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          locale="vi"
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
          eventMouseEnter={handleMouseEnter}
          eventMouseLeave={handleMouseLeave}
        />
      </div>

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
