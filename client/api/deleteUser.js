const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // Đường dẫn tới file JSON của bạn

// Khởi tạo Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export default async (req, res) => {
    if (req.method === 'DELETE') {
        const { id } = req.body; // Giả sử bạn gửi id trong body
        try {
            await admin.auth().deleteUser(id);
            return res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({ error: 'Error deleting user' });
        }
    } else {
        res.setHeader('Allow', ['DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};
