import express from "express";

import {
  createTicket,
  answerTicketQuestions,
  getTicketById,
  getDoctorsFromSuggestedDepartment,
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
router
  .route("/:ticketId/doctors")
  .get(verifyJWT, authorizeRoles("PATIENT"), getDoctorsFromSuggestedDepartment);

export default router;
