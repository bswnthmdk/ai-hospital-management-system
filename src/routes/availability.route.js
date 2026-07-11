import express from "express";

import {
  createAvailability,
  getAvailableSlots,
} from "../controllers/availability.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only a DOCTOR creates their own availability windows
router.route("/").post(verifyJWT, authorizeRoles("DOCTOR"), createAvailability);

// Open to any authenticated user — patients need this to book
router.route("/slots").get(verifyJWT, getAvailableSlots);

export default router;
