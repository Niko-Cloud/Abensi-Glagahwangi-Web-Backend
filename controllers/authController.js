import admin from "firebase-admin";

export const login = async (req, res, next) => {
    const { idToken } = req.body;

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const userDoc = await admin.firestore().collection("users").doc(uid).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.role === "admin") {
                res.json({ uid: uid, role: userData.role });
            } else {
                res.status(403).json({ error: "Unauthorized" });
            }
        } else {
            res.status(404).json({ error: "Unauthorized" });
        }

        req.partDescription = `login`;
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
