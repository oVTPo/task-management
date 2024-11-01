const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.updateMonthlyLoginTime = functions.firestore
    .document("sessions/{sessionId}")
    .onUpdate(async (change, context) => {
      const session = change.after.data();
      const userId = session.userId;
      const loginTime = session.loginTime.toDate();
      const logoutTime = session.logoutTime ?
      session.logoutTime.toDate() : null; // Đưa '?' và ':' lên cuối dòng


      // Chỉ xử lý nếu có logoutTime
      if (logoutTime) {
        const duration = (logoutTime - loginTime) / 1000;
        const year = loginTime.getFullYear();
        const month = loginTime.getMonth() + 1;

        // Xác định document của tháng
        const monthlyDocRef = db.collection("monthly_login_time")
            .doc(`${userId}_${year}_${month}`);

        // Cập nhật tổng thời gian đăng nhập của tháng
        await db.runTransaction(async (t) => {
          const doc = await t.get(monthlyDocRef);
          if (doc.exists) {
            const currentTotal = doc.data().totalLoginTime || 0;
            t.update(monthlyDocRef, {
              totalLoginTime: currentTotal + duration,
            });
          } else {
            t.set(monthlyDocRef, {
              userId,
              year,
              month,
              totalLoginTime: duration,
            });
          }
        });
      }
    });
