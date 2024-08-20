import Router from "express";
import {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import multer from "multer";
import { logAdminActivity } from "../middleware/logMiddleware.js";

const upload = multer({ storage: multer.memoryStorage() });

const userRouter = Router();

userRouter.get("/users", getAllUsers);
userRouter.get("/users/:uid?", getUser);
userRouter.post("/users", upload.single("image"), createUser, logAdminActivity);
userRouter.put("/users/:uid", upload.single("image"), updateUser, logAdminActivity);
userRouter.delete("/users/:id?", deleteUser, logAdminActivity);

export default userRouter;
