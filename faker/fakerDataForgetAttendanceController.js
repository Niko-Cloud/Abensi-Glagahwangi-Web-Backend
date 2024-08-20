import admin from "firebase-admin";
import { faker } from "@faker-js/faker";
import { db } from "../services/firebase.js";

async function fetchUsers() {
  const usersSnapshot = await db.collection("users").get();
  return usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function fetchEventDates() {
  const eventsSnapshot = await db.collection("holidays").get();
  return eventsSnapshot.docs.map((doc) => doc.data().date);
}

function getAllDatesInRange(startDate, endDate, excludeDates) {
  const dates = [];
  const date = new Date(startDate);

  while (date <= endDate) {
    const formattedDate = date.toISOString().split("T")[0];
    if (
      ![0, 6].includes(date.getDay()) &&
      !excludeDates.includes(formattedDate)
    ) {
      dates.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

async function generateForgotAttendanceData(users, eventDates, startDate, endDate) {
  const forgotAttendanceDataList = [];
  const dates = getAllDatesInRange(startDate, endDate, eventDates);

  for (const user of users) {
    const randomDates = faker.helpers.arrayElements(
      dates,
      faker.datatype.number({ min: 10, max: 15 })
    );
    for (const date of randomDates) {
      const formattedDate = date.toISOString().split("T")[0];
      const documentId = `${user.id}_${formattedDate}`;
      const fileUrl = "https://pdfhost.io/v/4Tzxsm29f_Sample_Permission"; // Fixed URL
      const status = faker.helpers.arrayElement(["diterima", "ditolak"]);

      const forgotAttendanceData = {
        id: documentId,
        uid: user.id,
        date: formattedDate,
        file_url: fileUrl, // Use fixed URL here
        description: "Lupa absen",
        checked_by_admin: false,
        status: status,
        createdTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      forgotAttendanceDataList.push(forgotAttendanceData);
    }
  }
  return forgotAttendanceDataList;
}

async function insertForgotAttendanceData(forgotAttendanceDataList) {
  const batch = db.batch();
  forgotAttendanceDataList.forEach((data) => {
    const docRef = db.collection("forgot_attendance").doc(data.id);
    batch.set(docRef, data);
  });
  await batch.commit();
}

async function updateAttendanceData(forgotAttendanceDataList) {
  const batch = db.batch();
  for (const forgotAttendance of forgotAttendanceDataList) {
    const attendanceRef = db.collection("attendance").doc(forgotAttendance.id);
    const attendanceDoc = await attendanceRef.get();
    const existingAttendanceData = attendanceDoc.exists
      ? attendanceDoc.data()
      : {};
    const attendanceData = {
      ...existingAttendanceData,
      id: forgotAttendance.id,
      uid: forgotAttendance.uid,
      date: forgotAttendance.date,
      description: forgotAttendance.description,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (forgotAttendance.status === "diterima") {
      attendanceData.attendanceStatus = "absen";
      attendanceData.status = "absen normal dari lupa absen";
      attendanceData.in = {
        image: forgotAttendance.file_url,
        in: false,
        location: "---",
        status: "absen",
        time: "--:--:--",
      };
      attendanceData.out = {
        image: forgotAttendance.file_url,
        in: false,
        location: "---",
        status: "absen",
        time: "--:--:--",
      };
    } else if (forgotAttendance.status === "ditolak") {
      attendanceData.attendanceStatus = "alfa";
      attendanceData.status = "absen ditolak";
      attendanceData.in = {
        image: "https://picsum.photos/200/300",
        in: false,
        location: "---",
        status: "ALFA",
        time: "--:--:--",
      };
      attendanceData.out = {
        image: "https://picsum.photos/200/300",
        in: false,
        location: "---",
        status: "ALFA",
        time: "--:--:--",
      };
    }

    batch.set(attendanceRef, attendanceData, { merge: true });
  }
  await batch.commit();
}

async function generateAndInsertForgotAttendanceData() {
  try {
    const users = await fetchUsers();
    const eventDates = await fetchEventDates();
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2024, 7, 7);


    const forgotAttendanceDataList = await generateForgotAttendanceData(
      users, eventDates, startDate, endDate
    );
    await insertForgotAttendanceData(forgotAttendanceDataList);
    await updateAttendanceData(forgotAttendanceDataList);

    console.log("Forgot attendance data generated and inserted successfully.");
  } catch (error) {
    console.error(`Error generating forgot attendance data: ${error.message}`);
  }
}

generateAndInsertForgotAttendanceData();
