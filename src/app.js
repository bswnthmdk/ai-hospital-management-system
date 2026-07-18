import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import errorHandler from "./middlewares/errHandler.middleware.js";
import authRouter from "./routes/auth.route.js";
import departmentRouter from "./routes/department.route.js";
import doctorRouter from "./routes/doctor.route.js";
import patientRouter from "./routes/patient.route.js";
import availabilityRouter from "./routes/availability.route.js";
import appointmentRouter from "./routes/appointment.route.js";
import adminRouter from "./routes/admin.route.js";
import ticketRouter from "./routes/ticket.route.js";

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// test route
app.get("/", (req, res) => {
  console.log("Hospital backend running");
  res.send("Hospital backend running");
});

// routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/departments", departmentRouter);
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/patients", patientRouter);
app.use("/api/v1/availability", availabilityRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/tickets", ticketRouter);

// centralized error handler — must be registered last
app.use(errorHandler);

export default app;
