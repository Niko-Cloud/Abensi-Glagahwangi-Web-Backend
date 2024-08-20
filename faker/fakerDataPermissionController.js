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

async function generatePermissionsData(users, eventDates, startDate, endDate) {
  const permissionsData = [];
  const dates = getAllDatesInRange(startDate, endDate, eventDates);

  for (const user of users) {
    const randomDates = faker.helpers.arrayElements(
      dates,
      faker.datatype.number({ min: 10, max: 15 })
    );
    for (const date of randomDates) {
      const formattedDate = date.toISOString().split("T")[0];
      const type = faker.helpers.arrayElement([
        "Sakit",
        "Cuti",
        "Izin Pribadi",
        "Lainnya",
      ]);
      const status = faker.helpers.arrayElement(["approved", "rejected"]);
      const permission = {
        id: `${user.id}_${formattedDate}`,
        uid: user.id,
        description: "Permission Description",
        type: type,
        status: status,
        date: formattedDate,
        file: "https://pdfhost.io/v/4Tzxsm29f_Sample_Permission",
        checked_by_admin: true,
        createdTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      permissionsData.push(permission);
    }
  }
  return permissionsData;
}

async function insertPermissionsData(permissionsData) {
  const batch = db.batch();
  permissionsData.forEach((data) => {
    const docRef = db.collection("permissions").doc(data.id);
    batch.set(docRef, data);
  });
  await batch.commit();
}

async function updateAttendanceData(permissionsData) {
  const batch = db.batch();
  for (const permission of permissionsData) {
    const attendanceRef = db.collection("attendance").doc(permission.id);
    const attendanceDoc = await attendanceRef.get();
    const existingAttendanceData = attendanceDoc.exists
      ? attendanceDoc.data()
      : {};
    const attendanceData = {
      ...existingAttendanceData,
      id: permission.id,
      uid: permission.uid,
      date: permission.date,
      description: permission.description,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (permission.status === "approved") {
      attendanceData.attendanceStatus = "izin";
      attendanceData.status = "diterima";
      attendanceData.in = {
        image: permission.file,
        in: existingAttendanceData.in ? existingAttendanceData.in.in : false,
        location: existingAttendanceData.in
          ? existingAttendanceData.in.location
          : "---",
        status: "IZIN",
        time: existingAttendanceData.in
          ? existingAttendanceData.in.time
          : "--:--:--",
      };
      attendanceData.out = {
        image: permission.file,
        in: existingAttendanceData.out ? existingAttendanceData.out.in : false,
        location: existingAttendanceData.out
          ? existingAttendanceData.out.location
          : "---",
        status: "IZIN",
        time: existingAttendanceData.out
          ? existingAttendanceData.out.time
          : "--:--:--",
      };
    } else if (permission.status === "rejected") {
      attendanceData.attendanceStatus = "absen";
      attendanceData.status = "permission ditolak, absen normal";
    }

    batch.set(attendanceRef, attendanceData, { merge: true });
  }
  await batch.commit();
}

async function generateAndInsertPermissionsData() {
  try {
    const users = await fetchUsers();
    const eventDates = await fetchEventDates();
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2024, 7, 7);

    const permissionsData = await generatePermissionsData(
      users, eventDates, startDate, endDate
    );
    await insertPermissionsData(permissionsData);
    await updateAttendanceData(permissionsData);

    console.log("Permissions data generated and inserted successfully.");
  } catch (error) {
    console.error(`Error generating permissions data: ${error.message}`);
  }
}

generateAndInsertPermissionsData();
