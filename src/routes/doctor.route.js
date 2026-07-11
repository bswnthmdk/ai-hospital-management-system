import express from "express";

import {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
} from "../controllers/doctor.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Read access — open to any authenticated user (patients need this to browse doctors)
router.route("/").get(verifyJWT, getAllDoctors);
router.route("/:doctorId").get(verifyJWT, getDoctorById);

// Write access — ADMIN only
router
  .route("/:doctorId")
  .patch(verifyJWT, authorizeRoles("ADMIN"), updateDoctor);
router
  .route("/:doctorId/status")
  .patch(verifyJWT, authorizeRoles("ADMIN"), updateDoctorStatus);

export default router;
