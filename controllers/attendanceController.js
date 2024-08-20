import admin from "firebase-admin";

export const getAllAttendance = async (req, res) => {
  try {
    const {
      _sort = "date",
      _order = "ASC",
      _page = "1",
      _limit = "10",
      date_gte,
      date_lte,
      uid,
    } = req.query;

    const page = parseInt(_page, 10);
    const limit = parseInt(_limit, 10);
    const order = _order.toUpperCase() === "DESC" ? "desc" : "asc";

    let query = admin.firestore().collection("attendance");

    if (date_gte) {
      query = query.where("date", ">=", date_gte);
    }
    if (date_lte) {
      query = query.where("date", "<=", date_lte);
    }
    if (uid) {
      query = query.where("uid", "==", uid);
    }

    query = query.orderBy(_sort, order);
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    if (page > 1) {
      const startSnapshot = await query.limit((page - 1) * limit).get();
      const lastVisible = startSnapshot.docs[startSnapshot.docs.length - 1];
      query = query.startAfter(lastVisible);
    }

    const snapshot = await query.limit(limit).get();
    const attendance = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.setHeader("X-Total-Count", `${total}`);
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.status(200).send(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(400).send({ error: error.message });
  }
};

export const updateAttendanceStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).send({ error: "Status is required" });
  }

  try {
    const attendanceRef = admin.firestore().collection("attendance").doc(id);
    let attendanceData = await attendanceRef.get();

    const updateData = { status };

    if (status === "ditolak") {
      updateData.attendanceStatus = "alfa";
      updateData.description = "absen ditolak";
      updateData["in.status"] = "alfa";
      updateData["out.status"] = "alfa";


      const overtimeRef = admin.firestore().collection("overtime").doc(id);
      const overtimeDoc = await overtimeRef.get();

      if (overtimeDoc.exists) {
        await overtimeRef.update({ status: "ditolak", duration: 0 });
      }
    } else if (status === "diterima") {
      updateData.attendanceStatus = "absen";
      updateData.description = "absen normal";
      updateData["in.status"] = "absen";
      updateData["out.status"] = "absen";
    }

    await attendanceRef.update(updateData);

    req.action = status === "diterima" ? "accepted" : "rejected";
    req.body.uid = attendanceData.data().uid;
    req.partDescription = `absen ${attendanceData.data().date}`;
    next();

    res.status(200).send({ message: "Status updated successfully" });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(400).send({ error: error.message });
  }
};
