// utils/getImage.js
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { app } from '../firebase'; // Đảm bảo import app từ cấu hình Firebase của bạn

const getImageURL = async (imageName) => {
  const storage = getStorage(app);
  const imageRef = ref(storage, `img/${imageName}`); // Đường dẫn đến hình ảnh trong Storage
  try {
    const url = await getDownloadURL(imageRef);
    return url; // Trả về URL hình ảnh
  } catch (error) {
    console.error('Lỗi lấy URL hình ảnh:', error);
    return null; // Trả về null nếu có lỗi
  }
};

export default getImageURL;
