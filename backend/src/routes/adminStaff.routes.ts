import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifySuperAdmin } from "../middlewares/admin.middleware";
import {
  listAdminsController,
  createAdminController,
  promoteUserController,
  updateAdminPermissionsController,
  revokeAdminController,
} from "../controllers/adminStaff.controller";

const router = Router();

router.use(verifyUser);
router.use(verifySuperAdmin);

router.get("/admins", listAdminsController);
router.post("/admins", createAdminController);
router.post("/admins/promote", promoteUserController);
router.patch("/admins/:adminId/permissions", updateAdminPermissionsController);
router.post("/admins/:adminId/revoke", revokeAdminController);

export default router;
