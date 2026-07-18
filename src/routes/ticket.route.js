import express from "express";

import { createTicket } from "../controllers/ticket.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only a PATIENT can create a ticket
router.route("/").post(verifyJWT, authorizeRoles("PATIENT"), createTicket);

export default router;
