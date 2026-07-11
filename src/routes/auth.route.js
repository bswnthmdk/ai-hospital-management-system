import express from "express";

import {
  registerPatient,
  loginPatient,
  registerDoctor,
  loginDoctor,
  logoutUser,
  registerAdmin,
  loginAdmin,
  refreshAccessToken,
} from "../controllers/auth.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();
// router.route("/<path>").<method>(<middleware>,<controller>);

// Patient auth
router.route("/register/patient").post(registerPatient);
router.route("/login/patient").post(loginPatient);

// Doctor auth
// Only an authenticated ADMIN can create doctor accounts
router
  .route("/register/doctor")
  .post(verifyJWT, authorizeRoles("ADMIN"), registerDoctor);
router.route("/login/doctor").post(loginDoctor);

// Admin auth
router.route("/register/admin").post(registerAdmin); // gated by secret key, not JWT
router.route("/login/admin").post(loginAdmin);

// Shared
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
