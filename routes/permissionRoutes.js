import { Router } from "express";
import {
  getAllPermissions,
  updatePermissionStatus,
  deletePermission,
} from "../controllers/permissionController.js";
import multer from "multer";
import { logAdminActivity } from "../middleware/logMiddleware.js";

const upload = multer();
const router = Router();

router.get("/permissions", getAllPermissions);
router.patch("/permissions/:id/status", updatePermissionStatus, logAdminActivity);
router.delete("/permissions/:id", deletePermission, logAdminActivity);

export default router;
