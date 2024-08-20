import { Router } from "express";
import {
  getAllForgotAttendance,
  updateForgotAttendanceStatus,
} from "../controllers/forgotAttendanceController.js";
import multer from "multer";
import { logAdminActivity } from "../middleware/logMiddleware.js";

const upload = multer();
const router = Router();

router.get("/forgot_attendance", getAllForgotAttendance);
router.patch("/forgot_attendance/:id/status", updateForgotAttendanceStatus, logAdminActivity);

export default router;
