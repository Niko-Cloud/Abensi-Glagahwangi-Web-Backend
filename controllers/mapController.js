import admin from "firebase-admin";

export const getMapData = async (req, res) => {
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

    let query = admin.firestore().collection("map");

    query = query.orderBy(_sort, order);

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

    const total = 1;

    res.setHeader("X-Total-Count", `${total}`);
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.status(200).send(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(400).send({ error: error.message });
  }
};

export const getMap = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error("No document ID provided");
    }

    const doc = await admin
      .firestore()
      .collection("map")
      .doc(id)
      .get();

    if (!doc.exists) {
      throw new Error(`Document not found for ID: ${id}`);
    }

    const geofenceData = { id: doc.id, ...doc.data() };

    const output = [geofenceData];

    res.status(200).send(output);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

export const updateGeofenceRadius = async (req, res, next) => {
  const { id } = req.params;
  const { radius, lat, long } = req.body;

  try {
    const geofenceRadiusRef = admin
      .firestore()
      .collection("map")
      .doc(id);
    const geofenceRadiusDoc = await geofenceRadiusRef.get();

    if (!geofenceRadiusDoc.exists) {
      return res.status(404).send({ error: "Geofence not found" });
    }

    const updateData = { id, radius, lat, long };

    await geofenceRadiusRef.update({
      radius,
      lat,
      long,
    });

    req.action = 'updated';
    req.body.uid = "_";
    req.partDescription = `batas lokasi pengguna dengan titik lat ${lat} dan long ${long} dan radius ${radius} meter`;
    next();


    res.status(200).send(updateData);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};
