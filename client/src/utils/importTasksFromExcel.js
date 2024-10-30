// utils/importTasksFromExcel.js

import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { Timestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

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
            deadline: task.deadline ? Timestamp.fromDate(new Date(task.deadline)) : null,
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
