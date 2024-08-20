import { Router } from "express";
import {
  getAllDinas,
  deleteDinas,
  updateDinasStatus,
} from "../controllers/dinasController.js";
import multer from "multer";
import { logAdminActivity } from "../middleware/logMiddleware.js";

const upload = multer();
const router = Router();

router.get("/dinas", getAllDinas);
router.delete("/dinas/:id?", deleteDinas, logAdminActivity);
router.patch("/dinas/:id?/status", updateDinasStatus, logAdminActivity);

export default router;
