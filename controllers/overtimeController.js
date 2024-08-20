import admin from "firebase-admin";

export const getAllOvertimes = async (req, res) => {
  try {
    const {
      _sort = "date",
      _order = "ASC",
      _page = "1",
      _limit = "10",
      uid,
      date_gte,
      date_lte,
    } = req.query;

    const page = parseInt(_page, 10);
    const limit = parseInt(_limit, 10);
    const order = _order.toUpperCase() === "DESC" ? "desc" : "asc";

    let query = admin.firestore().collection("overtime");

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
    const overtimes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.setHeader("X-Total-Count", `${total}`);
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.status(200).send(overtimes);
  } catch (error) {
    console.error("Error fetching overtimes:", error);
    res.status(400).send({ error: error.message });
  }
};
