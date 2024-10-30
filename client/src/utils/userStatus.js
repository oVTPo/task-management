// userStatus.js
import { ref, onValue, onDisconnect, set, getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Hàm cập nhật trạng thái online/offline vào Realtime Database
export const setUserOnlineStatus = (uid) => {
  const db = getDatabase(); // Lấy Realtime Database
  const userStatusRef = ref(db, `/status/${uid}`); // Đường dẫn lưu trạng thái người dùng

  // Đối tượng lưu trạng thái offline
  const isOfflineForDatabase = {
    state: 'offline',
    last_changed: new Date().getTime(), // Thời gian thay đổi trạng thái
  };

  // Đối tượng lưu trạng thái online
  const isOnlineForDatabase = {
    state: 'online',
    last_changed: new Date().getTime(), // Thời gian thay đổi trạng thái
  };

  // Lắng nghe trạng thái kết nối
  onValue(ref(db, '.info/connected'), (snapshot) => {
    if (snapshot.val() === false) {
      return; // Không làm gì nếu không có kết nối
    }

    // Khi người dùng ngắt kết nối, đặt trạng thái offline
    onDisconnect(userStatusRef).set(isOfflineForDatabase).then(() => {
      // Khi người dùng đang kết nối, đặt trạng thái online
      set(userStatusRef, isOnlineForDatabase); // Sử dụng set ở đây
    });
  });
};

// Hàm cập nhật trạng thái offline
export const setUserOfflineStatus = (uid) => {
  const db = getDatabase(); // Lấy Realtime Database
  const userStatusRef = ref(db, `/status/${uid}`); // Đường dẫn lưu trạng thái người dùng

  // Đối tượng lưu trạng thái offline
  const isOfflineForDatabase = {
    state: 'offline',
    last_changed: new Date().getTime(), // Thời gian thay đổi trạng thái
  };

  // Cập nhật trạng thái offline vào Realtime Database
  set(userStatusRef, isOfflineForDatabase);
};