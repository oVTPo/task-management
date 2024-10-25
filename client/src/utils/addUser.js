import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firestore } from '../firebase'; // Import Firestore từ firebase cấu hình của bạn
import { doc, setDoc } from 'firebase/firestore';

export const addUser = async (email, name, role) => {
  const auth = getAuth();
  const temporaryPassword = 'temporaryPassword123'; // Mật khẩu tạm thời

  try {
    // Tạo người dùng với email và mật khẩu tạm thời
    const userCredential = await createUserWithEmailAndPassword(auth, email, temporaryPassword);
    const uid = userCredential.user.uid; // Lấy UID của người dùng mới

    // Lưu thông tin người dùng vào Firestore
    const newUserRef = doc(firestore, 'users', uid);
    await setDoc(newUserRef, {
      email,
      name,
      role,
      temporaryPassword, // Lưu mật khẩu tạm thời (nên mã hóa hoặc bảo mật hơn nếu cần)
    });

    console.log("Người dùng đã được thêm thành công với UID:", uid);
  } catch (error) {
    throw new Error("Có lỗi khi thêm người dùng: " + error.message);
  }
};
