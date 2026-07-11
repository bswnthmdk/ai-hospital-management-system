import express from "express";

import { getDashboardStats } from "../controllers/admin.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router
  .route("/dashboard-stats")
  .get(verifyJWT, authorizeRoles("ADMIN"), getDashboardStats);

export default router;
