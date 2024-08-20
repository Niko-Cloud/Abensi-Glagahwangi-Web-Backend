import express from "express";
import bodyParser from "body-parser";
import userRouter from "./routes/userRoutes.js";
import holidayRouter from "./routes/holidayRoutes.js";
import permissionRouter from "./routes/permissionRoutes.js";
import dinasRouter from "./routes/dinasRoutes.js";
import attendanceRouter from "./routes/attendanceRoutes.js";
import forgotAttendanceRoutes from "./routes/forgotAttendanceRoutes.js";
import overtimeRoutes from "./routes/overtimeRoutes.js";
import geofenceRoutes from "./routes/mapRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import logRoutes from "./routes/logRoutes.js";

import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(userRouter);
app.use(holidayRouter);
app.use(permissionRouter);
app.use(dinasRouter);
app.use(attendanceRouter);
app.use(forgotAttendanceRoutes);
app.use(overtimeRoutes);
app.use(geofenceRoutes);
app.use(authRoutes);
app.use(logRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
