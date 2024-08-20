import admin from "firebase-admin";
import { faker } from "@faker-js/faker";
import { db } from "../services/firebase.js";

async function fetchUsers() {
  const usersSnapshot = await db.collection("users").get();
  return usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function fetchEventDates() {
  const eventsSnapshot = await db.collection("events").get();
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

async function generateOvertimeData(users, eventDates, startDate, endDate) {
  const overtimeData = [];
  const dates = getAllDatesInRange(startDate, endDate, eventDates);

  for (const user of users) {
    const overtimeCount = Math.floor(Math.random() * 9);
    for (let i = 0; i < overtimeCount; i++) {
      const dateIndex = Math.floor(Math.random() * dates.length);
      const date = dates[dateIndex];
      const formattedDate = date.toISOString().split("T")[0];
      const overtimeDuration = 2 + Math.floor(Math.random() * 3);
      const finishTime = new Date(date);
      finishTime.setHours(11 + overtimeDuration, 50, 0, 0);

      const overtime = {
        id: `${user.id}_${formattedDate}`,
        date: formattedDate,
        uid: user.id,
        status: "Lembur",
        finish: finishTime.toTimeString().split(" ")[0],
        duration: overtimeDuration,
      };

      overtimeData.push(overtime);
    }
  }
  return overtimeData;
}

async function updateAttendanceDataWithOvertime(overtimeData) {
  const batch = db.batch();
  overtimeData.forEach((data) => {
    const docRef = db.collection("attendance").doc(data.id);
    batch.set(
      docRef,
      {
        out: {
          status: "Pulang Lembur",
        },
        attendanceStatus: "lembur",
        description: "Melakukan Lembur",
      },
      { merge: true }
    );
    const overtimeDocRef = db.collection("overtime").doc(data.id);
    batch.set(overtimeDocRef, data, { merge: true });
  });
  await batch.commit();
}

async function generateAndInsertOvertimeData() {
  try {
    const users = await fetchUsers();
    const eventDates = await fetchEventDates();

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-08-08');

    const overtimeData = await generateOvertimeData(users, eventDates, startDate, endDate);
    await updateAttendanceDataWithOvertime(overtimeData);

    console.log("Fake overtime data generated and inserted successfully.");
  } catch (error) {
    console.error(`Error generating fake overtime data: ${error.message}`);
  }
}

generateAndInsertOvertimeData();
