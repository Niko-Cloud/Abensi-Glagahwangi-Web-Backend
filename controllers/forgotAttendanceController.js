import admin from "firebase-admin";

const _formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getAllForgotAttendance = async (req, res) => {
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

    let query = admin.firestore().collection("forgot_attendance");

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

export const updateForgotAttendanceStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).send({ error: "Status is required" });
  }

  try {
    const forgotAttendanceRef = admin
      .firestore()
      .collection("forgot_attendance")
      .doc(id);
    const forgotAttendanceDoc = await forgotAttendanceRef.get();

    if (!forgotAttendanceDoc.exists) {
      return res.status(404).send({ error: "Forgot attendance not found" });
    }

    const updateData = { status };
    const attendanceData = forgotAttendanceDoc.data();
    const uid = attendanceData.uid;
    const date = new Date(attendanceData.date);
    const formattedDate = _formatDate(date);
    const documentId = `${uid}_${formattedDate}`;
    const imageUrl = attendanceData.image || "https://picsum.photos/200/300";

    if (status === "ditolak") {
      updateData.status = "ditolak";

      const attendanceUpdateData = {
        id: documentId,
        uid: uid,
        date: formattedDate,
        attendanceStatus: "alfa",
        description: "absen ditolak",
        in: { ...attendanceData.in, status: "alfa" },
        out: { ...attendanceData.out, status: "alfa" },
      };

      await admin
        .firestore()
        .collection("attendance")
        .doc(documentId)
        .set(attendanceUpdateData, { merge: true });
    } else if (status === "diterima") {
      updateData.status = "diterima";

      const attendanceUpdateData = {
        id: documentId,
        uid: uid,
        date: formattedDate,
        attendanceStatus: "absen",
        description: "absen normal dari lupa absen",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        in: {
          image: imageUrl,
          in: false,
          location: "---",
          status: "absen",
          time: "--:--:--",
        },
        out: {
          image: imageUrl,
          in: false,
          location: "---",
          status: "absen",
          time: "--:--:--",
        },
      };

      await admin
        .firestore()
        .collection("attendance")
        .doc(documentId)
        .set(attendanceUpdateData, { merge: true });
    }

    req.action = status === "diterima" ? "accepted" : "rejected";
    req.body.uid = uid;
    req.partDescription = `lupa absen ${formattedDate}`;
    next();

    await forgotAttendanceRef.update(updateData);

    res.status(200).send({ message: "Status updated successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};
