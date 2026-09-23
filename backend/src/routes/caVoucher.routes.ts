import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import {
  getCaVoucherMeController,
  listCaVoucherCoursesController,
  requestCaVoucherController,
} from "../controllers/caVoucher.controller";

const router = Router();

/**
 * @route   GET /api/ca-vouchers/me
 * @desc    The signed-in CA's voucher eligibility and latest request, if any
 * @access  Any signed-in user
 */
router.get("/me", verifyUser, getCaVoucherMeController);

/**
 * @route   GET /api/ca-vouchers/courses?search=&page=&limit=
 * @desc    Published Airkrit courses eligible for the voucher
 * @access  Any signed-in user
 */
router.get("/courses", verifyUser, listCaVoucherCoursesController);

/**
 * @route   POST /api/ca-vouchers/me/request { courseId }
 * @desc    Request the one-time voucher for a course
 * @access  Any signed-in user
 */
router.post("/me/request", verifyUser, requestCaVoucherController);

export default router;
