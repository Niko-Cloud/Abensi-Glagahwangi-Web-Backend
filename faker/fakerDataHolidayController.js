import { createHoliday } from "../controllers/holidayController.js";

const indonesianHolidays2024 = [
  { name: "Tahun Baru Masehi", date: "2024-01-01" },
  { name: "Isra Mi'raj Nabi Muhammad SAW", date: "2024-02-08" },
  { name: "Cuti Bersama Tahun Baru Imlek", date: "2024-02-09" },
  { name: "Tahun Baru Imlek", date: "2024-02-10" },
  { name: "Nyepi (Tahun Baru Saka)", date: "2024-03-11" },
  { name: "Cuti Bersama Nyepi", date: "2024-03-12" },
  { name: "Wafat Yesus Kristus", date: "2024-03-29" },
  { name: "Hari Paskah", date: "2024-03-31" },
  { name: "Cuti Bersama Idul Fitri", date: "2024-04-08" },
  { name: "Cuti Bersama Idul Fitri", date: "2024-04-09" },
  { name: "Hari Raya Idul Fitri", date: "2024-04-10" },
  { name: "Libur Idul Fitri", date: "2024-04-11" },
  { name: "Cuti Bersama Idul Fitri", date: "2024-04-12" },
  { name: "Cuti Bersama Idul Fitri", date: "2024-04-15" },
  { name: "Hari Buruh Internasional", date: "2024-05-01" },
  { name: "Kenaikan Yesus Kristus", date: "2024-05-09" },
  { name: "Cuti Kenaikan Yesus Kristus", date: "2024-05-10" },
  { name: "Hari Raya Waisak", date: "2024-05-23" },
  { name: "Cuti Bersama Hari Raya Waisak", date: "2024-05-24" },
  { name: "Hari Lahir Pancasila", date: "2024-06-01" },
  { name: "Hari Raya Idul Adha", date: "2024-06-17" },
  { name: "Cuti Bersama Idul Adha", date: "2024-06-18" },
  { name: "Tahun Baru Islam (Muharram)", date: "2024-07-07" },
  { name: "Hari Kemerdekaan Indonesia", date: "2024-08-17" },
  { name: "Maulid Nabi Muhammad SAW", date: "2024-09-15" },
  { name: "Hari Natal", date: "2024-12-25" },
  { name: "Boxing Day", date: "2024-12-26" },
];

async function generateAndInsertData() {
  for (const holiday of indonesianHolidays2024) {
    const req = {
      body: holiday,
    };

    const res = {
      status: (code) => {
        return {
          send: (data) => console.log(`Status: ${code}`, data),
        };
      },
    };

    try {
      await createHoliday(req, res);
    } catch (error) {
      console.error("Error creating holiday:", error);
    }
  }
}

generateAndInsertData()
  .then(() => {
    console.log("Data generation completed.");
  })
  .catch((error) => {
    console.error("Error in data generation:", error);
  });
