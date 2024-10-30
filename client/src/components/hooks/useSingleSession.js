import { getDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, firestore } from '../../firebase'; // Đường dẫn đến cấu hình Firebase của bạn

const useSingleSession = (userId) => {
  useEffect(() => {
    if (!userId) {
      console.error('userId không hợp lệ:', userId);
      return;
    }

    const sessionRef = doc(firestore, 'sessions', userId);
    
    const checkSession = async () => {
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        // Nếu không có phiên, tạo một phiên mới
        await setDoc(sessionRef, { sessionId: 'your-unique-session-id' });
      } else {
        // Nếu đã có phiên, thông báo và đăng xuất
        alert('Tài khoản của bạn đã được đăng nhập trên một thiết bị/tab khác.');
        
        window.location.href = '/login';
      }
    };

    checkSession();

    // Xử lý khi tắt tab hoặc trình duyệt
    const handleBeforeUnload = async () => {
      await deleteDoc(sessionRef); // Xóa phiên trong Firestore
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Dọn dẹp khi component unmount
      window.removeEventListener('beforeunload', handleBeforeUnload);
      deleteDoc(sessionRef); // Xóa phiên khi component unmount
    };
  }, [userId]); // Đảm bảo userId là ID của người dùng đang đăng nhập
};

export default useSingleSession;
