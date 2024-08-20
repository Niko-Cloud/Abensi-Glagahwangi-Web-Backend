import admin from "firebase-admin";

const _formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getAllDinas = async (req, res) => {
  try {
    const {
      _sort = "date",
      _order = "ASC",
      _page = "1",
      _limit = "10",
      uid,
    } = req.query;

    const page = parseInt(_page, 10);
    const limit = parseInt(_limit, 10);
    const order = _order.toUpperCase() === "DESC" ? "desc" : "asc";

    let query = admin.firestore().collection("dinas");

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

export const updateDinasStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).send({ error: "Status is required" });
  }

  try {
    const dinasRef = admin.firestore().collection("dinas").doc(id);
    const dinasDoc = await dinasRef.get();

    if (!dinasDoc.exists) {
      return res.status(404).send({ error: "Permission not found" });
    }

    await dinasRef.update({ status });

    const dinasData = dinasDoc.data();
    const uid = dinasData.uid;
    const date = new Date(dinasData.date);
    const formattedDate = _formatDate(date);
    const documentId = `${uid}_${formattedDate}`;

    const attendanceRef = admin
      .firestore()
      .collection("attendance")
      .doc(documentId);
    const attendanceDoc = await attendanceRef.get();

    const existingAttendanceData = attendanceDoc.exists
      ? attendanceDoc.data()
      : {};

    const attendanceData = {
      ...existingAttendanceData,
      id: documentId,
      uid: uid,
      date: formattedDate,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (existingAttendanceData.in) {
      attendanceData.in = {
        ...existingAttendanceData.in,
        status: existingAttendanceData.in.status,
        image: "https://picsum.photos/200/300",
        in: existingAttendanceData.in.in,
        location: existingAttendanceData.in.location,
        time: existingAttendanceData.in.time,
      };
    }

    if (existingAttendanceData.out) {
      attendanceData.out = {
        ...existingAttendanceData.out,
        status: existingAttendanceData.out.status,
        image: "https://picsum.photos/200/300",
        out: existingAttendanceData.out.in,
        location: existingAttendanceData.out.location,
        time: existingAttendanceData.out.time,
      };
    }

    if (status === "approved") {
      attendanceData.attendanceStatus = "dinas";
      attendanceData.status = "dinas diterima";
      attendanceData.description = dinasData.description;
      if (attendanceData.in) {
        attendanceData.in.status = "DINAS";
      }
    } else if (status === "rejected") {
      attendanceData.attendanceStatus = "absen";
      attendanceData.status = "dinas ditolak, absen normal";
    }

    await attendanceRef.set(attendanceData, { merge: true });

    req.action = status === "approved" ? "accepted" : "rejected";
    req.body.uid = dinasData.uid;
    req.partDescription = `dinas ${dinasData.date}`;
    next();

    res.status(200).send({ message: "Status updated successfully" });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(400).send({ error: error.message });
  }
};

export const deleteDinas = async (req, res, next) => {
  try {
    let eventIds;

    if (req.params.id) {
      eventIds = [req.params.id];
    } else {
      const { id } = req.query;

      if (!id) {
        return res.status(400).send({ error: "No events IDs provided" });
      }

      eventIds = id.split(",");
    }

    const deletePromises = eventIds.map(async (id) => {
      const dinasDoc = await admin
        .firestore()
        .collection("dinas")
        .doc(id)
        .get();

      if (!dinasDoc.exists) {
        throw new Error(`Dinas with ID ${id} does not exist`);
      }

      const dinasData = dinasDoc.data();
      const imageUrl = dinasData.imageUrl;

      if (imageUrl && imageUrl !== "/default") {
        const fileName = imageUrl.split("/").pop();
        const bucket = admin.storage().bucket();
        await bucket.file(fileName).delete();
      }

      req.action = "deleted";
      req.body.uid = uid;
      req.partDescription = `menghapus dinas ${dinasData.date}`;
      next();

      await admin.firestore().collection("dinas").doc(id).delete();
      return id;
    });

    const deletedIds = await Promise.all(deletePromises);

    res.status(200).send({
      data: deletedIds,
      message: "dinas and images deleted successfully",
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};
