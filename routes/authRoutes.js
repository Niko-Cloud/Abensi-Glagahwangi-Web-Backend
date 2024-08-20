import { Router } from "express";
import {
    login
} from "../controllers/authController.js";
import multer from "multer";
import { logAdminActivity } from "../middleware/logMiddleware.js";

const upload = multer();
const router = Router();

router.post("/login", upload.none(), login, logAdminActivity);

export default router;
