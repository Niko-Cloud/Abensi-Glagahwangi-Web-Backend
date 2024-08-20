import admin from "firebase-admin";
import serviceAccount from "../key.json" assert { type: "json" };

const adminApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://(default).firebaseio.com",
  storageBucket: "gs://absensi-glagahwangi.appspot.com",
});

admin.firestore().settings({ ignoreUndefinedProperties: true });
const db = adminApp.firestore();
const auth = adminApp.auth();

export { db, auth, adminApp };
