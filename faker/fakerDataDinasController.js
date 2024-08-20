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

async function generateDinasData(users, eventDates, startDate, endDate) {
  const dinasData = [];
  const dates = getAllDatesInRange(startDate, endDate, eventDates);

  for (const user of users) {
    const randomDates = faker.helpers.arrayElements(
      dates,
      faker.datatype.number({ min: 10, max: 20 })
    );
    for (const date of randomDates) {
      const formattedDate = date.toISOString().split("T")[0];
      const status = faker.helpers.arrayElement(["approved", "rejected"]);
      const dinas = {
        id: `${user.id}_${formattedDate}`,
        uid: user.id,
        description: "Dinas Luar",
        date: formattedDate,
        type: "Izin Dinas",
        file: "https://pdfhost.io/v/k2l8uXvG6_Sample_Dinas",
        status: status,
        checked_by_admin: true,
        createdTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      dinasData.push(dinas);
    }
  }
  return dinasData;
}

async function insertDinasData(dinasData) {
  const batch = db.batch();
  dinasData.forEach((data) => {
    const docRef = db.collection("dinas").doc(data.id);
    batch.set(docRef, data);
  });
  await batch.commit();
}

async function updateAttendanceData(dinasData) {
  const batch = db.batch();
  for (const dinas of dinasData) {
    const attendanceRef = db.collection("attendance").doc(dinas.id);
    const attendanceDoc = await attendanceRef.get();
    const existingAttendanceData = attendanceDoc.exists
      ? attendanceDoc.data()
      : {};
    const attendanceData = {
      ...existingAttendanceData,
      id: dinas.id,
      uid: dinas.uid,
      date: dinas.date,
      description: dinas.description,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (dinas.status === "approved") {
      attendanceData.attendanceStatus = "dinas";
      attendanceData.status = "dinas diterima";
      if (attendanceData.in) {
        attendanceData.in.status = "DINAS";
      }
    } else if (dinas.status === "rejected") {
      attendanceData.attendanceStatus = "absen";
      attendanceData.status = "dinas ditolak, absen normal";
    }

    batch.set(attendanceRef, attendanceData, { merge: true });
  }
  await batch.commit();
}

async function generateAndInsertDinasData() {
  try {
    const users = await fetchUsers();
    const eventDates = await fetchEventDates();
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2024, 7, 7);

    const dinasData = await generateDinasData(users, eventDates, startDate, endDate);
    await insertDinasData(dinasData);
    await updateAttendanceData(dinasData);

    console.log("Dinas data generated and inserted successfully.");
  } catch (error) {
    console.error(`Error generating dinas data: ${error.message}`);
  }
}

generateAndInsertDinasData();
