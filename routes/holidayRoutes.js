import { Router } from "express";
import {
  getAllHolidays,
  getHoliday,
  createHoliday,
  updateHoliday,
  deleteHolidays,
} from "../controllers/holidayController.js";
import multer from "multer";
import { logAdminActivity } from "../middleware/logMiddleware.js";


const upload = multer();
const router = Router();

router.get("/holidays", getAllHolidays);
router.get("/holidays/:id?", getHoliday);
router.post("/holidays", upload.none(), createHoliday, logAdminActivity);
router.put("/holidays/:id", upload.none(), updateHoliday, logAdminActivity);
router.delete("/holidays/:id?", deleteHolidays, logAdminActivity);

export default router;
