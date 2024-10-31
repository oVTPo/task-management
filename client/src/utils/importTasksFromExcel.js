import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { Timestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// Hàm phân tích định dạng ngày giờ
const parseDate = (dateString) => {
  // Kiểm tra xem dateString có phải là chuỗi không
  if (typeof dateString !== 'string') {
    console.warn(`Giá trị không hợp lệ cho deadline: ${dateString}`);
    return null; // Trả về null nếu không phải chuỗi
  }

  // Sử dụng RegEx để phân tích chuỗi ngày giờ
  const regex = /(\d{2})\/(\d{2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})/; // Định dạng dd/MM/yyyy HH:mm:ss
  const match = dateString.match(regex);
  
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Tháng 0-11
    const year = parseInt(match[3], 10);
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    const seconds = parseInt(match[6], 10);
    
    // Tạo đối tượng Date
    const date = new Date(year, month, day, hours, minutes, seconds);
    
    // Chuyển đổi sang Timestamp của Firestore
    return Timestamp.fromDate(date);
  }

  console.warn(`Không thể phân tích ngày giờ từ chuỗi: ${dateString}`); // Ghi nhận nếu không phân tích được
  return null; // Trả về null nếu không thể phân tích
};

export const importTasksFromExcel = async (file) => {
  if (!file) {
    alert('Vui lòng chọn file trước khi nhập!');
    return;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      try {
        for (const task of jsonData) {
          // Tìm UID của assignedTo dựa vào name
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('name', '==', task.assignedTo));
          const usersSnapshot = await getDocs(q);

          if (usersSnapshot.empty) {
            console.warn(`Không tìm thấy người dùng có tên: ${task.assignedTo}`);
            continue;
          }

          const userDoc = usersSnapshot.docs[0];
          const assignedToUid = userDoc.id;

          // Tạo dữ liệu nhiệm vụ
          const newTask = {
            name: task.name || '',
            assignedTo: assignedToUid,
            type: task.type || '',
            description: task.description || '',
            deadline: parseDate(task.deadline) || null, // Sử dụng hàm parseDate
            status: task.status || 'Mới',
          };

          // Thêm nhiệm vụ vào Firestore
          const tasksRef = collection(db, 'tasks');
          await addDoc(tasksRef, newTask);
          console.log(`Nhiệm vụ "${newTask.name}" đã được thêm thành công!`);
        }
        resolve(); // Kết thúc Promise thành công
      } catch (error) {
        console.error(`Lỗi khi nhập nhiệm vụ: ${error.message}`);
        reject(error); // Kết thúc Promise với lỗi
      }
    };

    reader.readAsArrayBuffer(file);
  });
};
