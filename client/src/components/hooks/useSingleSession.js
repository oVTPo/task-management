import { getDoc, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';
import { firestore } from '../../firebase'; // Đường dẫn đến cấu hình Firebase của bạn
import { v4 as uuidv4 } from 'uuid';

const useSingleSession = (userId) => {
  useEffect(() => {
    if (!userId) {
      console.error('userId không hợp lệ:', userId);
      return;
    }

    const sessionRef = doc(firestore, 'sessions', userId);
    const sessionId = uuidv4(); // Tạo session ID duy nhất cho mỗi phiên

    const establishSession = async () => {
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        // Nếu không có phiên, tạo một phiên mới với sessionId
        await setDoc(sessionRef, { sessionId });
      } else {
        // Nếu đã có phiên khác với sessionId hiện tại, thông báo và điều hướng
        const currentSessionId = sessionDoc.data().sessionId;
        if (currentSessionId !== sessionId) {
          alert('Tài khoản của bạn đã được đăng nhập trên một thiết bị/tab khác.');
          window.location.href = '/login';
        }
      }
    };

    // Lắng nghe thay đổi của phiên trong Firestore theo thời gian thực
    const unsubscribe = onSnapshot(sessionRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const currentSessionId = docSnapshot.data().sessionId;
        if (currentSessionId !== sessionId) {
          alert('Tài khoản của bạn đã được đăng nhập trên một thiết bị/tab khác.');
          window.location.href = '/login';
        }
      }
    });

    establishSession();

    // Xử lý khi tắt tab hoặc trình duyệt
    const handleBeforeUnload = async () => {
      await deleteDoc(sessionRef); // Xóa phiên trong Firestore
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Dọn dẹp khi component unmount
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribe(); // Hủy đăng ký lắng nghe onSnapshot
      deleteDoc(sessionRef); // Xóa phiên khi component unmount
    };
  }, [userId]); // Đảm bảo userId là ID của người dùng đang đăng nhập
};

export default useSingleSession;
