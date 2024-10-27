import { firestore } from './firebase'; // Import Firestore

export const getUserData = async (uid) => {
  const docRef = firestore.collection('users').doc(uid);
  const doc = await docRef.get();
  return doc.exists ? { uid: doc.id, ...doc.data() } : null; // Trả về dữ liệu người dùng hoặc null
};
