// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore"; 

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAN_LIqvug6xt9ByoRviUjDmiTy7Ybh9oc",
  authDomain: "task-management-8a8f9.firebaseapp.com",
  projectId: "task-management-8a8f9",
  storageBucket: "task-management-8a8f9.appspot.com",
  messagingSenderId: "825291689172",
  appId: "1:825291689172:web:1ec40f3e6119b6dd543f41",
  measurementId: "G-D8B9M6EM1W"
};

// Khởi tạo ứng dụng Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firebase Auth
const auth = getAuth(app); // Giữ lại khai báo này

// Khởi tạo Firestore
const firestore = getFirestore(app); // Giữ lại khai báo này

export { auth, firestore }; // Xuất cả hai biến
