import { Router } from "express";
import {
  getAllFAQsController,
  getFAQByIdController,
  createFAQController,
  updateFAQController,
  deleteFAQController,
  getFAQsByIdsController
} from "../controllers/faq.controller";
// import { verifyAdmin } from "../middlewares/admin.middleware";

const router = Router();

/**
 * @route   GET /api/faqs
 * @desc    Get all FAQs with pagination and search
 * @access  Public
 * @params
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - search: Search term for question and answer (optional)
 * @example
 *   GET /api/faqs?page=1&limit=10&search=access
 */
router.get("/", getAllFAQsController);

/**
 * @route   GET /api/faqs/:id
 * @desc    Get a FAQ by ID
 * @access  Public
 * @params
 *   - id: FAQ ID
 * @example
 *   GET /api/faqs/60f7b3b3b3b3b3b3b3b3b3b3
 */
router.get("/:id", getFAQByIdController);

/**
 * @route   POST /api/faqs
 * @desc    Create a new FAQ
 * @access  Admin
 * @body
 *   - question: FAQ question (required)
 *   - answer: FAQ answer (required)
 * @example
 *   POST /api/faqs
 *   {
 *     "question": "How long do I have access to the course?",
 *     "answer": "You have lifetime access to the course content."
 *   }
 */
router.post("/", createFAQController);
// For production, uncomment the line below to require admin authentication:
// router.post("/", verifyAdmin, createFAQController);

/**
 * @route   PUT /api/faqs/:id
 * @desc    Update an existing FAQ
 * @access  Admin
 * @params
 *   - id: FAQ ID
 * @body
 *   - question: Updated FAQ question (optional)
 *   - answer: Updated FAQ answer (optional)
 * @example
 *   PUT /api/faqs/60f7b3b3b3b3b3b3b3b3b3b3
 *   {
 *     "question": "Updated question",
 *     "answer": "Updated answer"
 *   }
 */
router.put("/:id", updateFAQController);
// For production, uncomment the line below to require admin authentication:
// router.put("/:id", verifyAdmin, updateFAQController);

/**
 * @route   DELETE /api/faqs/:id
 * @desc    Delete an FAQ
 * @access  Admin
 * @params
 *   - id: FAQ ID
 * @example
 *   DELETE /api/faqs/60f7b3b3b3b3b3b3b3b3b3b3
 */
router.delete("/:id", deleteFAQController);
// For production, uncomment the line below to require admin authentication:
// router.delete("/:id", verifyAdmin, deleteFAQController);

/**
 * @route   POST /api/faqs/by-ids
 * @desc    Get FAQs by array of IDs
 * @access  Public
 * @body
 *   - ids: Array of FAQ IDs
 * @example
 *   POST /api/faqs/by-ids
 *   {
 *     "ids": ["60f7b3b3b3b3b3b3b3b3b3b3", "60f7b3b3b3b3b3b3b3b3b3b4"]
 *   }
 */
router.post("/by-ids", getFAQsByIdsController);

export default router;
