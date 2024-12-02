import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

const WorkSchedule = () => {
  const [events, setEvents] = useState([]); // Trạng thái chính để đồng bộ với FullCalendar
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");

  // Hàm tải lịch từ Firestore
  const loadScheduleFromFirestore = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
  
    if (!user) {
      alert("Bạn cần đăng nhập để xem lịch làm việc.");
      return;
    }
  
    const userId = user.uid;
    const db = getFirestore();
  
    try {
      const docRef = doc(db, `users/${userId}/workSchedules/${weekStart}`);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const scheduleData = docSnap.data();
        const eventsData = [];
  
        for (const date in scheduleData.days) {
          scheduleData.days[date].forEach((timeSlot) => {
            const startDate = new Date(`${date}T${timeSlot.start}`);
            const endDate = new Date(`${date}T${timeSlot.end}`);
  
            eventsData.push({
              id: `${date}-${timeSlot.start}-${timeSlot.end}`,
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              allDay: false,
              status: timeSlot.status || "offline", // Thêm trạng thái
            });
          });
        }
  
        setEvents(eventsData);
      } else {
        console.log("Không tìm thấy lịch làm việc cho tuần này.");
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch:", error.message);
    }
  };
  

  useEffect(() => {
    if (weekStart) {
      loadScheduleFromFirestore();
    }
  }, [weekStart]);

  // Xác định tuần hiển thị
  const handleDatesSet = (dateInfo) => {
    const localStartDate = new Date(dateInfo.start).toLocaleDateString("en-CA"); // yyyy-mm-dd
    setWeekStart(localStartDate);

    const startOfWeek = new Date(localStartDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    setWeekEnd(endOfWeek.toLocaleDateString("en-CA"));
  };

  // Thêm sự kiện
  const handleDateSelect = (selectInfo) => {
    const { start, end } = selectInfo;
  
    const status = window.prompt(
      "Nhập trạng thái (offline/online):",
      "offline"
    );
  
    if (!status || (status !== "offline" && status !== "online")) {
      alert("Trạng thái không hợp lệ. Hãy nhập offline hoặc online.");
      return;
    }
  
    const newEvent = {
      id: String(new Date().getTime()),
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
      status,
    };
  
    setEvents((prev) => [...prev, newEvent]);
    selectInfo.view.calendar.unselect();
  };
  
  

  // Xóa sự kiện
  const handleEventClick = (clickInfo) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa lịch làm việc không?`
    );
    if (confirmDelete) {
      const eventId = clickInfo.event.id;

      setEvents((prev) => prev.filter((event) => event.id !== eventId)); // Loại bỏ sự kiện khỏi danh sách
    }
  };

  // Kéo thả sự kiện
  const handleEventDrop = (dropInfo) => {
    const { event } = dropInfo;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? { ...e, start: event.start.toISOString(), end: event.end.toISOString() }
          : e
      )
    );
  };

  // Thay đổi kích thước sự kiện
  const handleEventResize = (resizeInfo) => {
    const { event } = resizeInfo;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? { ...e, start: event.start.toISOString(), end: event.end.toISOString() }
          : e
      )
    );
  };

  // Lưu lịch vào Firestore
  const handleSave = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("Bạn cần đăng nhập để lưu lịch làm việc.");
      return;
    }

    const userId = user.uid;
    const db = getFirestore();
    const schedule = transformScheduleToFirestore(events);

    try {
      const docRef = doc(db, `users/${userId}/workSchedules/${weekStart}`);
      await setDoc(docRef, {
        weekStart,
        days: schedule,
      });

      alert("Lịch làm việc đã được lưu thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu lịch:", error.message);
      alert("Không thể lưu lịch, vui lòng thử lại.");
    }
  };

  const transformScheduleToFirestore = (events) => {
    const schedule = {};

    events.forEach((event) => {
      const date = event.start.substring(0, 10);

      const localStart = new Date(event.start).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
      });

      const localEnd = new Date(event.end).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
      });

      if (!schedule[date]) {
        schedule[date] = [];
      }

      schedule[date].push({
        start: localStart,
        end: localEnd,
        status: event.status,
      });
    });

    return schedule;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full">
      <div>
        <div className="flex justify-between mb-4">
          <h1 className='text-4xl text-primary font-bold'>Đăng ký giờ làm việc</h1>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
          >
            Lưu Lịch
          </button>
        </div>
        <div className="p-4 border border-red-500 bg-red-100 rounded-lg mb-8 flex text-red-500 items-center">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl mr-4"/>
          <div>
            <p className="font-medium"> Bạn đăng kí lịch trên đây bằng cách kéo thả chuột theo từng khung thời gian bạn mong muốn đăng ký. Bấm 1 lần vào ô thời gian để xoá khoảng thời gian đó.</p>
            <p className="font-bold"> Lưu ý: khi bạn thực hiện thêm, sửa hoặc xoá thời gian thì hãy bấm lưu để thay đổi</p>
          </div>
        </div>
      </div>
      <div className="h-auto">
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
          initialView="timeGridWeek"
          editable={true}
          selectable={true}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          datesSet={handleDatesSet}
          allDaySlot={false} // Loại bỏ ô "All Day"
          slotMinTime="07:00:00" // Giờ bắt đầu trong ngày
          slotMaxTime="20:00:00" // Giờ kết thúc trong ngày
          locale="vi"
          buttonText={{
            today: "Hôm nay",
            next: "Sau",
            prev: "Trước",
          }}
          eventContent={(arg) => {
            // Tùy chỉnh nội dung thẻ sự kiện
            const status = arg.event.extendedProps.status; // Lấy trạng thái
            return (
              <div className="flex flex-col p-4">
                <span className={` font-semibold text-lg ${status === "online" ? "text-yellow-800" : "text-primary-800"}`}>
                  {status === "online" ? "Online" : "Offline"}
                </span>
                <span className="font-semibold text-gray-500">{arg.timeText}</span>
              </div>
            );
          }}
          eventClassNames={(arg) => {
            if (arg.event.extendedProps.status === "offline") {
              return "bg-primary-200 text-primary";
            } else if (arg.event.extendedProps.status === "online") {
              return "bg-yellow-200 text-white";
            }
            return "";
          }}
          height="auto"  // Tự động điều chỉnh chiều cao
          contentHeight="auto" // Đảm bảo phần nội dung tự động thay đổi chiều cao
        />
      </div>  
    </div>
  );
};

export default WorkSchedule;
