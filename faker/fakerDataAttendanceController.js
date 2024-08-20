import admin from "firebase-admin";
import { faker } from "@faker-js/faker";
import { db } from "../services/firebase.js";
import path from "path";
import { fileURLToPath } from "url";

const imageUrls = [
  "https://i.postimg.cc/pTDzLtNj/1.jpg",
  "https://i.postimg.cc/Twq5Xqmq/10.jpg",
  "https://i.postimg.cc/tJqZRZN0/11.jpg",
  "https://i.postimg.cc/wMwt1qw1/12.jpg",
  "https://i.postimg.cc/Df64j677/13.jpg",
  "https://i.postimg.cc/MKGMhBGV/14.jpg",
  "https://i.postimg.cc/L60YRsq7/15.jpg",
  "https://i.postimg.cc/FHdfKQ3K/16.jpg",
  "https://i.postimg.cc/x1wXJF33/17.jpg",
  "https://i.postimg.cc/bv1sQH6c/18.jpg",
  "https://i.postimg.cc/TY2gfSty/2.jpg",
  "https://i.postimg.cc/ZnHN6F5K/3.jpg",
  "https://i.postimg.cc/TYkmw9st/4.jpg",
  "https://i.postimg.cc/DfP1VFPk/5.jpg",
  "https://i.postimg.cc/MpvBjB2q/6.jpg",
  "https://i.postimg.cc/fRp97bDX/7.jpg",
  "https://i.postimg.cc/85Vf3nFz/8.jpg",
  "https://i.postimg.cc/mr9FmGgn/9.jpg"
];

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

function getRandomImage() {
  const randomIndex = Math.floor(Math.random() * imageUrls.length);
  return imageUrls[randomIndex];
}

async function generateAttendanceData(users, eventDates, startDate, endDate) {
  const attendanceData = [];
  const dates = getAllDatesInRange(startDate, endDate, eventDates);

  for (const user of users) {
    for (const date of dates) {
      const formattedDate = date.toISOString().split("T")[0];
      const inLocation = faker.location.streetAddress();
      const outLocation = faker.location.streetAddress();
      const statusIn = Math.random() < 0.5 ? "Tepat Waktu" : "Terlambat";
      const statusOut = "Pulang";

      const inData = {
        time: faker.date.recent().toTimeString().split(" ")[0],
        location: inLocation,
        image: getRandomImage(),
        in: true,
        status: statusIn,
      };

      const outData = {
        time: faker.date.recent().toTimeString().split(" ")[0],
        location: outLocation,
        status: statusOut,
        image: getRandomImage(),
        out: true,
      };

      const attendance = {
        id: `${user.id}_${formattedDate}`,
        uid: user.id,
        date: formattedDate,
        in: inData,
        out: outData,
        attendanceStatus: "absen",
        description: "Melakukan Absen Normal",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "diterima",
      };

      attendanceData.push(attendance);
    }
  }
  return attendanceData;
}

async function insertAttendanceData(attendanceData) {
  const batch = db.batch();
  attendanceData.forEach((data) => {
    const docRef = db.collection("attendance").doc(data.id);
    batch.set(docRef, data);
  });
  await batch.commit();
}

async function generateAndInsertAttendanceData() {
  try {
    const users = await fetchUsers();
    const eventDates = await fetchEventDates();
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2024, 7, 7);

    const attendanceData = await generateAttendanceData(users, eventDates, startDate, endDate);
    await insertAttendanceData(attendanceData);

    console.log("Fake attendance data generated and inserted successfully.");
  } catch (error) {
    console.error(`Error generating fake attendance data: ${error.message}`);
  }
}

generateAndInsertAttendanceData();
