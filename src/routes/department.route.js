import express from "express";

import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  toggleDepartmentStatus,
} from "../controllers/department.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Read access — open to any authenticated user (patients/doctors need this to pick a department)
router.route("/").get(verifyJWT, getAllDepartments);
router.route("/:departmentId").get(verifyJWT, getDepartmentById);

// Write access — ADMIN only
router.route("/").post(verifyJWT, authorizeRoles("ADMIN"), createDepartment);
router
  .route("/:departmentId")
  .patch(verifyJWT, authorizeRoles("ADMIN"), updateDepartment);
router
  .route("/:departmentId/toggle-status")
  .patch(verifyJWT, authorizeRoles("ADMIN"), toggleDepartmentStatus);

export default router;
