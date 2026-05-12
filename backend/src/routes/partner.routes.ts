import { Router } from "express";
import { verifyUser, verifyPartner } from "../middlewares/user.middleware";
import {
  getPartnerMe,
  getPartnerDashboard,
  listPartnerStudents,
} from "../controllers/partner.controller";

const router = Router();

router.use(verifyUser, verifyPartner);

/** Partner's own context (linked college). */
router.get("/me", getPartnerMe);

/** Dashboard stats scoped to the partner's college. */
router.get("/dashboard", getPartnerDashboard);

/** Paginated list of students at the partner's college. */
router.get("/students", listPartnerStudents);

export default router;
