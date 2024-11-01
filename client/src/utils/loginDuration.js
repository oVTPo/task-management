import { getFirestore, doc, setDoc, Timestamp, getDoc } from "firebase/firestore";

const db = getFirestore();

export const logUserLogin = async (userId) => {
    const loginTime = Timestamp.now();
    const loginDate = loginTime.toDate(); // Chuyển đổi Timestamp thành Date
    const monthYear = `${loginDate.getFullYear()}_${(loginDate.getMonth() + 1).toString().padStart(2, '0')}`; // Định dạng `YYYY_MM`

    const userRef = doc(db, "users", userId);
    const loginRecordRef = doc(userRef, "loginRecords", monthYear);

    // Cập nhật hồ sơ đăng nhập với thời gian đăng nhập hiện tại
    await setDoc(loginRecordRef, {
        lastLogin: loginTime,
    }, { merge: true });
};

export const logUserLogout = async (userId) => {
    try {
        const logoutTime = Timestamp.now();
        const logoutDate = logoutTime.toDate(); // Chuyển đổi Timestamp thành Date
        const monthYear = `${logoutDate.getFullYear()}_${(logoutDate.getMonth() + 1).toString().padStart(2, '0')}`; // Định dạng `YYYY_MM`

        const userRef = doc(db, "users", userId);
        const logoutRecordRef = doc(userRef, "loginRecords", monthYear);
        
        // Lấy thông tin đăng nhập gần nhất từ Firestore
        const loginRecordsSnapshot = await getDoc(logoutRecordRef);

        if (!loginRecordsSnapshot.exists()) {
            console.error('Không tìm thấy hồ sơ đăng nhập cho người dùng:', userId);
            return; // Thoát nếu không có hồ sơ
        }

        // Lấy thời gian đăng nhập
        const loginData = loginRecordsSnapshot.data();
        const loginTime = loginData.lastLogin; // Thời gian đăng nhập gần nhất
        const loginDurationMillis = logoutTime.toMillis() - loginTime.toMillis(); // Tính toán thời gian đã đăng nhập (mili giây)

        // Xử lý cập nhật loginDuration
        let newLoginDuration = loginData.loginDuration || 0; // Nếu loginDuration là null thì gán 0
        newLoginDuration += loginDurationMillis / 1000; // Cộng dồn thời gian đăng nhập và chuyển đổi sang giây

        // Cập nhật hồ sơ đăng nhập với thời gian đăng xuất
        await setDoc(logoutRecordRef, {
            lastLogout: logoutTime,
            loginDuration: newLoginDuration, // Ghi lại thời gian đã đăng nhập (tính bằng giây)
        }, { merge: true });

        console.log('Đăng xuất thành công:', {
            userId,
            lastLogout: logoutTime.toISOString(),
            loginDuration: newLoginDuration // Thời gian đã đăng nhập tính bằng giây
        });
    } catch (error) {
        console.error('Lỗi khi ghi lại thời gian đăng xuất:', error);
    }
};