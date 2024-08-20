import admin from "firebase-admin";
import { db, adminApp } from "../services/firebase.js";

const createMap = async ({ radius, lat, long }) => {
    try {
        const docId = "radius_document";
        await adminApp.firestore().collection("map").doc(docId).set({
            id: docId,
            radius,
            lat,
            long,
        });

        const createdMap = {
            id: docId,
            radius,
            lat,
            long,
        };

        console.log(createdMap);
    } catch (error) {
        console.error({ error: error.message });
    }
};

// Example usage
createMap({
    radius: "50",
    lat: "-7.6481967",
    long: "110.6633733",
}).then(() => {
    console.log("Map creation completed.");
}).catch((error) => {
    console.error("Map creation error:", error);
});
