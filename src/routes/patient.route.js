import express from "express";

import {
  getAllPatients,
  getPatientById,
} from "../controllers/patient.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ADMIN only — patient records are sensitive, no doctor/self-service here yet
router.route("/").get(verifyJWT, authorizeRoles("ADMIN"), getAllPatients);
router
  .route("/:patientId")
  .get(verifyJWT, authorizeRoles("ADMIN"), getPatientById);

export default router;
