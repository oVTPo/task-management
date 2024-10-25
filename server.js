

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors'); // Nhập cors
const serviceAccount = require('./serviceAccountKey.json'); // Đường dẫn tới tệp JSON của bạn

const app = express();
const port = 5001; // Cổng cho server

// Khởi tạo Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

app.use(cors({
    origin: '*', // Cho phép tất cả các nguồn gốc
}));
app.use(express.json()); // Cho phép phân tích JSON

app.delete('/api/deleteUser', async (req, res) => {
    const { id } = req.body; // Lấy id từ body
    try {
        await admin.auth().deleteUser(id);
        await admin.firestore().collection('users').doc(id).delete();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
});

// Khởi động server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
