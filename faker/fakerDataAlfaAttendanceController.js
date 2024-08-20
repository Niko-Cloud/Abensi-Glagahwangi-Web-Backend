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

async function generateAbsentData(users, eventDates, startDate, endDate) {
  const absentDataList = [];
  const dates = getAllDatesInRange(startDate, endDate, eventDates);

  for (const user of users) {
    const randomDates = faker.helpers.arrayElements(
      dates,
      faker.datatype.number({ min: 10, max: 15 })
    );
    for (const date of randomDates) {
      const formattedDate = date.toISOString().split("T")[0];
      const documentId = `${user.id}_${formattedDate}`;

      const absentData = {
        id: documentId,
        uid: user.id,
        date: formattedDate,
        attendanceStatus: "alfa",
        description: "Absen Otomatis",
        status: "diterima",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        in: {
          image: "https://picsum.photos/200/300",
          in: false,
          location: "---",
          status: "ALFA",
          time: "--:--:--",
        },
        out: {
          image: "https://picsum.photos/200/300",
          out: false,
          location: "---",
          status: "ALFA",
          time: "--:--:--",
        },
      };

      absentDataList.push(absentData);
    }
  }
  return absentDataList;
}

async function insertOrUpdateAbsentData(absentDataList) {
  const batch = db.batch();
  absentDataList.forEach((data) => {
    const docRef = db.collection("attendance").doc(data.id);
    batch.set(docRef, data, { merge: true });
  });
  await batch.commit();
}

async function generateAndInsertOrUpdateAbsentData() {
  try {
    const users = await fetchUsers();
    const eventDates = await fetchEventDates();
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2024, 7, 7);

    const absentDataList = await generateAbsentData(users, eventDates, startDate, endDate);
    await insertOrUpdateAbsentData(absentDataList);

    console.log("Absent data generated and updated successfully.");
  } catch (error) {
    console.error(`Error generating absent data: ${error.message}`);
  }
}

generateAndInsertOrUpdateAbsentData();
