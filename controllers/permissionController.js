import admin from "firebase-admin";

const _formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getAllPermissions = async (req, res) => {
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

    let query = admin.firestore().collection("permissions");

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
    const permissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.setHeader("X-Total-Count", `${total}`);
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.status(200).send(permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(400).send({ error: error.message });
  }
};

export const updatePermissionStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).send({ error: "Status is required" });
  }

  try {
    const permissionRef = admin.firestore().collection("permissions").doc(id);
    const permissionDoc = await permissionRef.get();

    if (!permissionDoc.exists) {
      return res.status(404).send({ error: "Permission not found" });
    }

    await permissionRef.update({ status });

    const permissionData = permissionDoc.data();
    const uid = permissionData.uid;
    const date = new Date(permissionData.date);
    const formattedDate = _formatDate(date);
    const documentId = `${uid}_${formattedDate}`;
    const imageUrl = permissionData.image;

    const attendanceRef = admin
      .firestore()
      .collection("attendance")
      .doc(documentId);
    const attendanceDoc = await attendanceRef.get();

    const existingAttendanceData = attendanceDoc.exists
      ? attendanceDoc.data()
      : {};

    if (status === "approved") {
      const attendanceData = {
        ...existingAttendanceData,
        id: documentId,
        uid: uid,
        date: formattedDate,
        attendanceStatus: "izin",
        status: "diterima",
        description: permissionData.description,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        in: {
          image: imageUrl,
          in: existingAttendanceData.in ? existingAttendanceData.in.in : false,
          location: existingAttendanceData.in
            ? existingAttendanceData.in.location
            : "---",
          status: "IZIN",
          time: existingAttendanceData.in
            ? existingAttendanceData.in.time
            : "--:--:--",
        },
        out: {
          image: imageUrl,
          in: existingAttendanceData.out
            ? existingAttendanceData.out.in
            : false,
          location: existingAttendanceData.out
            ? existingAttendanceData.out.location
            : "---",
          status: "IZIN",
          time: existingAttendanceData.out
            ? existingAttendanceData.out.time
            : "--:--:--",
        },
      };
      await attendanceRef.set(attendanceData, { merge: true });
      req.action = 'accepted';
      req.body.uid = uid;
      req.partDescription = `izin pengguna ${formattedDate}`;
      next();
    } else if (status === "rejected") {
      const updatedAttendanceData = {
        ...existingAttendanceData,
        attendanceStatus: "absen",
        status: "izin ditolak",
        in: admin.firestore.FieldValue.delete(),
        out: admin.firestore.FieldValue.delete(),
      };
      await attendanceRef.update(updatedAttendanceData);
      req.action = 'rejected';
      req.body.uid = uid;
      req.partDescription = `izin pengguna ${formattedDate}`;
      next();
    }

    res.status(200).send({ message: "Status updated successfully" });

  } catch (error) {
    console.error('Error updating status:', error);
    res.status(400).send({ error: error.message });
  }
};

export const deletePermission = async (req, res, next) => {
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
      const permissionDoc = await admin
        .firestore()
        .collection("permissions")
        .doc(id)
        .get();

      if (!permissionDoc.exists) {
        throw new Error(`Permission with ID ${id} does not exist`);
      }

      const permissionData = permissionDoc.data();
      const imageUrl = permissionData.imageUrl;

      if (imageUrl && imageUrl !== "/default") {
        const fileName = imageUrl.split("/").pop();
        const bucket = admin.storage().bucket();
        await bucket.file(fileName).delete();
      }

      await admin.firestore().collection("permissions").doc(id).delete();
      return id;
    });
    req.action = 'deleted';
    req.body.uid = userRecord.uid;
    req.partDescription = `izin pengguna ${date}`;
    next();

    const deletedIds = await Promise.all(deletePromises);
    res.status(200).send({
      data: deletedIds,
      message: "Permissions and images deleted successfully",
    });

  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};
