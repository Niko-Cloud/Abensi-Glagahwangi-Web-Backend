import { Router } from "express";
import {
  getAllAttendance,
  updateAttendanceStatus,
} from "../controllers/attendanceController.js";
import multer from "multer";
import { logAdminActivity } from "../middleware/logMiddleware.js";

const upload = multer();
const router = Router();

router.get("/attendance", getAllAttendance);
router.patch("/attendance/:id/status", updateAttendanceStatus, logAdminActivity);

export default router;
