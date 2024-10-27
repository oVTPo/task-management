import { firestore } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// Hàm đăng ký lắng nghe thay đổi trong collection 'tasks'
export const subscribeToTaskNotifications = (userId, callback) => {
  const tasksRef = collection(firestore, 'tasks');

  // Tạo truy vấn chỉ lấy nhiệm vụ của người dùng hiện tại
  const q = query(tasksRef, where('assignedTo', '==', userId));

  // Sử dụng onSnapshot để lắng nghe thay đổi trên Firestore
  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const newTask = change.doc.data();
        callback(newTask); // Gọi callback với nhiệm vụ mới
      } else if (change.type === 'modified') {
        const updatedTask = change.doc.data();
        callback(updatedTask); // Gọi callback với nhiệm vụ được cập nhật
      }
    });
  });

  // Trả về hàm unsubscribe để hủy theo dõi
  return unsubscribe;
};

// Hàm lắng nghe thông báo chưa đọc từ collection 'notifications'
export const listenForNotifications = (callback) => {
  const notificationsRef = collection(firestore, 'notifications'); // Đảm bảo collection này chứa thông báo

  // Lắng nghe sự thay đổi trong collection thông báo
  const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
    let hasUnread = false;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isUnread) { // Giả sử có trường 'isUnread' đánh dấu thông báo chưa đọc
        hasUnread = true;
      }
    });
    callback(hasUnread);
  });

  // Trả về hàm unsubscribe để hủy theo dõi
  return unsubscribe;
};
