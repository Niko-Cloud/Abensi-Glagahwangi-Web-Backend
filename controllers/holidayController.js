import { db } from "../services/firebase.js";
import admin from "firebase-admin";

const preprocessName = (name) => {
  return name.toLowerCase().split(" ");
};

export const getAllHolidays = async (req, res) => {
  try {
    const {
      _sort = "date",
      _order = "ASC",
      _page = "1",
      _limit = "10",
      q = "",
    } = req.query;

    const page = parseInt(_page, 10);
    const limit = parseInt(_limit, 10);
    const order = _order.toUpperCase() === "DESC" ? "desc" : "asc";

    let query = admin.firestore().collection("holidays");

    if (q) {
      const searchKeywords = q.toLowerCase().split(" ");
      query = query.where("keywords", "array-contains-any", searchKeywords);
    }

    query = query.orderBy(_sort, order);

    if (page > 1) {
      const startSnapshot = await query.limit((page - 1) * limit).get();
      const lastVisible = startSnapshot.docs[startSnapshot.docs.length - 1];
      query = query.startAfter(lastVisible);
    }

    const snapshot = await query.limit(limit).get();
    const holidays = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const totalSnapshot = await admin.firestore().collection("holidays").get();
    const total = totalSnapshot.size;

    res.setHeader("X-Total-Count", `${total}`);
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.status(200).send(holidays);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(400).send({ error: error.message });
  }
};

export const createHoliday = async (req, res, next) => {
  try {
    let { name, date } = req.body;

    if (!name || !date) {
      return res.status(400).send({ error: "Name and date are required" });
    }

    name = name.toLowerCase();
    date = date.toLowerCase();

    const keywords = preprocessName(name);
    const id = date;

    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    await admin.firestore().collection("holidays").doc(id).set({
      id,
      name,
      date,
      keywords,
      createdTimestamp: timestamp,
      updatedTimestamp: timestamp,
    });

    req.body.uid = id;
    req.action = 'created';
    req.partDescription = `hari libur ${name}`;
    next();

    res.status(201).send({ id, name, date, keywords });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

export const getHoliday = async (req, res) => {
  try {
    const { ids } = req.query;
    const { id } = req.params;

    const getHolidayDetail = async (id) => {
      const holidayDoc = await db.collection("holidays").doc(id).get();

      if (!holidayDoc.exists) {
        throw new Error(`Holiday Not Found for ID: ${id}`);
      }

      return { id: id, ...holidayDoc.data() };
    };

    let holidays = [];

    if (ids) {
      const holidayIds = Array.isArray(ids) ? ids : [ids];
      holidays = await Promise.all(holidayIds.map(getHolidayDetail));
    } else if (id) {
      const holiday = await getHolidayDetail(id);
      holidays.push(holiday);
    } else {
      throw new Error("No holiday ID provided");
    }

    res.status(200).send(holidays);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

export const updateHoliday = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, date } = req.body;

    const holidayDoc = await db.collection("holidays").doc(id).get();

    if (!holidayDoc.exists) {
      return res.status(404).send({ error: "Holiday not found" });
    }

    const existingHoliday = holidayDoc.data();

    const updatedName = name || existingHoliday.name;
    const updatedDate = date || existingHoliday.date;

    const keywords = name ? preprocessName(name) : existingHoliday.keywords;

    const updatedTimestamp = admin.firestore.FieldValue.serverTimestamp();
    await db.collection("holidays").doc(id).update({
      name: updatedName,
      date: updatedDate,
      keywords,
      updatedTimestamp,
    });

    const updatedHoliday = {
      id: id,
      name: updatedName,
      date: updatedDate,
    };

    req.body.uid = id;
    req.action = 'updated';
    req.partDescription = `hari libur ${existingHoliday.name} menjadi ${updatedName}`;
    next();

    res.status(200).send(updatedHoliday);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

export const deleteHolidays = async (req, res, next) => {
  try {
    let holidayIds;

    if (req.params.id) {
      holidayIds = [req.params.id];
    } else {
      const { id } = req.query;

      if (!id) {
        return res.status(400).send({ error: "No holiday IDs provided" });
      }

      holidayIds = id.split(",");
    }

    let existingHoliday;
    if (holidayIds.length === 1) {
      const holidayDoc = await db.collection("holidays").doc(holidayIds[0]).get();
      existingHoliday = holidayDoc.exists ? holidayDoc.data() : null;
    }

    const deletePromises = holidayIds.map(async (id) => {
      await admin.firestore().collection("holidays").doc(id).delete();
      return id;
    });

    const deletedIds = await Promise.all(deletePromises);

    req.body.uid = existingHoliday ? existingHoliday.id : null;
    req.action = 'deleted';
    req.partDescription = existingHoliday ? `hari libur ${existingHoliday.name}` : 'multiple holidays';
    next();

    res.status(200).send({ data: deletedIds, message: "Holidays deleted successfully" });
  } catch (error) {
    console.error("Error deleting holidays:", error);
    res.status(500).send({ error: "Error deleting holidays" });
  }
};
