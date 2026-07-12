import express from "express";

import {
  assignDoctorTemporary,
  cancelAppointment,
  getAllAppointments,
} from "../controllers/appointment.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only a PATIENT books their own appointment
router
  .route("/")
  .post(verifyJWT, authorizeRoles("PATIENT"), assignDoctorTemporary);

// PATIENT or DOCTOR can cancel (ownership check should happen inside the controller)
router
  .route("/:appointmentId/cancel")
  .patch(verifyJWT, authorizeRoles("PATIENT", "DOCTOR"), cancelAppointment);

// ADMIN monitoring — full visibility across all appointments
router.route("/").get(verifyJWT, authorizeRoles("ADMIN"), getAllAppointments);

export default router;
