import { Router } from "express";
import { getAllOvertimes } from "../controllers/overtimeController.js";
import multer from "multer";

const upload = multer();
const router = Router();

router.get("/overtimes", getAllOvertimes);

export default router;
