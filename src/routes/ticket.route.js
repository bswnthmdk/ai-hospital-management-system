import express from "express";

import {
  createTicket,
  answerTicketQuestions,
  getTicketById,
} from "../controllers/ticket.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only a PATIENT can create a ticket
router.route("/").post(verifyJWT, authorizeRoles("PATIENT"), createTicket);
router
  .route("/:ticketId")
  .get(verifyJWT, authorizeRoles("PATIENT"), getTicketById);
router
  .route("/:ticketId/answer-questions")
  .patch(verifyJWT, authorizeRoles("PATIENT"), answerTicketQuestions);

export default router;
