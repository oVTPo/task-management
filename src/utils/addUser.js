import { collection, addDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Import auth từ firebase.js

export const addUser = async (userData) => {
  try {
    // Tạo tài khoản người dùng mới với email, không cần mật khẩu
    const userCredential = await auth.createUser({
      email: userData.email,
      // không đặt password ở đây
    });
    const user = userCredential.user;

    // Thêm thông tin người dùng vào Firestore
    const usersCollection = collection(firestore, 'users');
    await addDoc(usersCollection, {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      uid: user.uid, // Lưu UID của người dùng
      requiresPasswordChange: true // Thêm trường để yêu cầu thay đổi mật khẩu
    });

    console.log("Người dùng đã được thêm thành công!");
  } catch (error) {
    console.error("Lỗi khi thêm người dùng:", error);
  }
};
