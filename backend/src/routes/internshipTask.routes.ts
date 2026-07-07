import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin, requirePermission } from "../middlewares/admin.middleware";
import {
  listInternshipTasksAdminController,
  createInternshipTaskAdminController,
  getInternshipTaskByIdAdminController,
  updateInternshipTaskAdminController,
  deleteInternshipTaskAdminController,
} from "../controllers/internshipTask.controller";

const router = Router();

router.use(verifyUser);
router.use(verifyAdmin);
router.use(requirePermission("internships.tasks"));

/** POST /api/internship-tasks — create */
router.post("/", createInternshipTaskAdminController);

/** GET /api/internship-tasks/admin?page=1&limit=20&search=&status=all|active|inactive */
router.get("/admin", listInternshipTasksAdminController);

/** GET/PATCH/DELETE /api/internship-tasks/admin/:taskId */
router.get("/admin/:taskId", getInternshipTaskByIdAdminController);
router.patch("/admin/:taskId", updateInternshipTaskAdminController);
router.delete("/admin/:taskId", deleteInternshipTaskAdminController);

export default router;
