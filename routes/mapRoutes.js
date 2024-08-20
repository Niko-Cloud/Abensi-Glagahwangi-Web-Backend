import { Router } from "express";
import {
  getMap,
  getMapData,
  updateGeofenceRadius,
} from "../controllers/mapController.js";
import multer from "multer";
import { logAdminActivity } from "../middleware/logMiddleware.js";

const upload = multer();
const router = Router();

router.get("/geofence", getMapData);
router.get("/geofence/:id", getMap);
router.put("/geofence/:id?", upload.none(), updateGeofenceRadius, logAdminActivity);

export default router;
