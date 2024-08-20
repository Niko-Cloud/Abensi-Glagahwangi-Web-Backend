import { getDownloadURL } from "firebase-admin/storage";
import { db, auth } from "../services/firebase.js";
import admin from "firebase-admin";

const preprocessName = (name) => {
  return name.toLowerCase().split(" ");
};

export const getAllUsers = async (req, res) => {
  try {
    const {
      _sort = "name",
      _order = "ASC",
      _page = "1",
      _limit = "10",
      q = "",
    } = req.query;

    const page = parseInt(_page, 10);
    const limit = parseInt(_limit, 10);
    const start = (page - 1) * limit;

    const order = _order.toUpperCase() === "DESC" ? "desc" : "asc";

    let query = admin.firestore().collection("users");

    if (q) {
      const searchKeywords = q.toLowerCase().split(" ");
      query = query.where("keywords", "array-contains-any", searchKeywords);
    }

    query = query.orderBy(_sort, order).limit(limit);

    if (start > 0) {
      const startSnapshot = await admin
        .firestore()
        .collection("users")
        .orderBy(_sort, order)
        .limit(start)
        .get();
      const lastVisible = startSnapshot.docs[startSnapshot.docs.length - 1];
      query = query.startAfter(lastVisible);
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const querySnapshot = await query.get();
    const total = querySnapshot.size;

    res.setHeader("X-Total-Count", `${total}`);
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.status(200).send(users);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.query;
    const { uid } = req.params;

    const getUserDetails = async (uid) => {
      const userRecord = await auth.getUser(uid);
      const userDoc = await db.collection("users").doc(uid).get();

      if (!userDoc.exists) {
        throw new Error(`User not found for UID: ${uid}`);
      }

      return { ...userRecord.toJSON(), ...userDoc.data() };
    };

    let users = [];

    if (uid) {
      const user = await getUserDetails(uid);
      users.push(user);
    } else if (id) {
      const ids = Array.isArray(id) ? id : [id];
      users = await Promise.all(ids.map(getUserDetails));
    } else {
      throw new Error("No user ID provided");
    }

    res.status(200).send(users);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

export const createUser = async (req, res, next) => {
  try {
    const {
      email,
      password,
      name,
      phone = "",
      role,
      alamat = "",
      confirm_password,
    } = req.body;

    if (!email || !password || !name || !role) {
      throw new Error("Missing required fields: email, password, name, and role are required.");
    }

    const image = req.file;
    let photoURL = "https://picsum.photos/200/300";

    const lowercasedEmail = email.toLowerCase();
    const lowercasedName = name.toLowerCase();
    const lowercasedPhone = phone ? phone.toLowerCase() : "";
    const lowercasedRole = role.toLowerCase();
    const lowercasedAlamat = alamat ? alamat.toLowerCase() : "";

    const userRecord = await admin.auth().createUser({
      email: lowercasedEmail,
      password,
      displayName: lowercasedName,
      photoURL,
    });

    if (image) {
      const bucket = admin.storage().bucket();
      const fileName = `user_profiles/${userRecord.uid}`;
      const file = bucket.file(fileName);

      await file.save(image.buffer, {
        metadata: {
          contentType: image.mimetype,
        },
      });

      await file.makePublic();
      photoURL = file.publicUrl();
    }

    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      id: userRecord.uid,
      email: lowercasedEmail,
      name: lowercasedName,
      phone: lowercasedPhone,
      role: lowercasedRole,
      alamat: lowercasedAlamat,
      photoURL,
      createdTimestamp: timestamp,
      updatedTimestamp: timestamp,
    });

    const createdUser = {
      id: userRecord.uid,
      email: lowercasedEmail,
      name: lowercasedName,
      phone: lowercasedPhone,
      role: lowercasedRole,
      alamat: lowercasedAlamat,
      photoURL,
    };

    res.status(201).send(createdUser);
  } catch (error) {
    console.error("Error in createUser:", error);
    res.status(400).send({ error: error.message });
  }
};


export const updateUser = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const { email, name, phone, role, alamat } = req.body;
    const image = req.file;

    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const existingData = userDoc.data();

    const updatedEmail = email || existingData.email;
    const updatedName = name || existingData.name;
    const updatedPhone = phone || existingData.phone;
    const updatedRole = role || existingData.role;
    const updatedAlamat = alamat || existingData.alamat;
    let photoURL = existingData.photoURL;

    if (image) {
      const bucket = admin.storage().bucket();
      const fileName = `user_profiles/${uid}`;
      const file = bucket.file(fileName);

      await file.save(image.buffer, {
        metadata: {
          contentType: image.mimetype,
        },
      });

      await file.makePublic();
      photoURL = await getDownloadURL(file);
    }

    await admin.auth().updateUser(uid, {
      email: updatedEmail,
      displayName: updatedName,
      photoURL,
    });

    const keywords = preprocessName(updatedName);

    const updatedTimestamp = admin.firestore.FieldValue.serverTimestamp();
    await admin.firestore().collection("users").doc(uid).update({
      id: uid,
      email: updatedEmail,
      name: updatedName,
      phone: updatedPhone,
      role: updatedRole,
      photoURL: photoURL,
      alamat: updatedAlamat,
      keywords,
      updatedTimestamp,
    });

    const updatedUser = {
      id: uid,
      email: updatedEmail,
      name: updatedName,
      phone: updatedPhone,
      role: updatedRole,
      alamat: updatedAlamat,
      photoURL,
    };

    req.action = 'updated';
    req.partDescription = "user"
    req.body.uid = uid;
    res.status(200).send(updatedUser);
    next();
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};



const deleteUserDocuments = async (uid) => {
  const collections = [
    "attendance",
    "forgot_attendance",
    "permissions",
    "dinas",
    "overtime",
  ];
  const deletePromises = [];

  for (const collectionName of collections) {
    const querySnapshot = await admin
      .firestore()
      .collection(collectionName)
      .where(admin.firestore.FieldPath.documentId(), ">=", `${uid}_`)
      .where(admin.firestore.FieldPath.documentId(), "<", `${uid}_\uf8ff`)
      .get();
    querySnapshot.forEach((doc) => {
      deletePromises.push(
        admin.firestore().collection(collectionName).doc(doc.id).delete()
      );
    });
  }

  return Promise.all(deletePromises);
};

export const deleteUser = async (req, res, next) => {
  try {
    let userIds;
    let userNames = {};

    if (req.params.id) {
      userIds = [req.params.id];
    } else {
      const { id } = req.query;
      if (!id) {
        return res.status(400).send({ error: "No user IDs provided" });
      }
      userIds = id.split(",");
    }

    const deletePromises = userIds.map(async (uid) => {
      const userDoc = await admin.firestore().collection("users").doc(uid).get();
      if (!userDoc.exists) {
        throw new Error(`User not found for UID: ${uid}`);
      }

      const { photoURL, name } = userDoc.data();
      userNames[uid] = name || 'unknown user';

      await admin.auth().deleteUser(uid);
      await admin.firestore().collection("users").doc(uid).delete();

      if (photoURL && !photoURL.includes("https://picsum.photos/")) {
        const bucket = admin.storage().bucket();
        const fileName = `user_profiles/${uid}`;
        const file = bucket.file(fileName);
        await file.delete();
      }

      await deleteUserDocuments(uid);

      req.action = 'deleted';
      req.partDescription = "user"
      req.body.uid = uid;
      req.body.userName = userNames[uid];
      next();

      return uid;
    });

    const deletedIds = await Promise.all(deletePromises);

    res.status(200).send({
      data: deletedIds,
      message: "Users and related documents deleted successfully",
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};
