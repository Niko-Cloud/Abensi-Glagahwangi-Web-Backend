import { Router } from "express";
import {
    getAllLogs
} from "../controllers/logController.js";
import multer from "multer";

const upload = multer();
const router = Router();

router.get("/logs", getAllLogs);

export default router;
