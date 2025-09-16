import {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  searchFAQs,
  bulkCreateFAQs,
  getFAQStats,
} from "../controllers/faq.controller";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/faqs
 * @desc    Get all FAQs with pagination
 * @access  Public
 * @params
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - search: Search term for question/answer
 * @example
 *   GET /api/faqs?page=1&limit=10&search=payment
 */
router.get("/", getAllFAQs);

/**
 * @route   GET /api/faqs/search
 * @desc    Search FAQs
 * @access  Public
 * @params
 *   - q: Search term (required)
 *   - limit: Maximum results (default: 10)
 * @example
 *   GET /api/faqs/search?q=payment&limit=5
 */
router.get("/search", searchFAQs);

/**
 * @route   GET /api/faqs/stats
 * @desc    Get FAQ statistics
 * @access  Public
 * @example
 *   GET /api/faqs/stats
 */
router.get("/stats", getFAQStats);

/**
 * @route   GET /api/faqs/:faqId
 * @desc    Get FAQ by ID
 * @access  Public
 * @params
 *   - faqId: FAQ ID
 * @example
 *   GET /api/faqs/64a1b2c3d4e5f6789012345
 */
router.get("/:faqId", getFAQById);

/**
 * @route   POST /api/faqs
 * @desc    Create a new FAQ
 * @access  Admin
 * @body
 *   - question: FAQ question (required, min 5 chars)
 *   - answer: FAQ answer (required, min 10 chars)
 * @example
 *   POST /api/faqs
 *   Body: {
 *     "question": "How do I enroll in a course?",
 *     "answer": "To enroll in a course, click the 'Enroll Now' button on the course page and follow the payment process."
 *   }
 */
router.post("/", createFAQ);

/**
 * @route   POST /api/faqs/bulk
 * @desc    Bulk create FAQs
 * @access  Admin
 * @body
 *   - faqs: Array of FAQ objects
 * @example
 *   POST /api/faqs/bulk
 *   Body: {
 *     "faqs": [
 *       {
 *         "question": "Question 1",
 *         "answer": "Answer 1"
 *       },
 *       {
 *         "question": "Question 2", 
 *         "answer": "Answer 2"
 *       }
 *     ]
 *   }
 */
router.post("/bulk", bulkCreateFAQs);

/**
 * @route   PUT /api/faqs/:faqId
 * @desc    Update FAQ
 * @access  Admin
 * @params
 *   - faqId: FAQ ID
 * @body    FAQ update data (question, answer)
 * @example
 *   PUT /api/faqs/64a1b2c3d4e5f6789012345
 *   Body: {
 *     "question": "Updated question",
 *     "answer": "Updated answer"
 *   }
 */
router.put("/:faqId", updateFAQ);

/**
 * @route   DELETE /api/faqs/:faqId
 * @desc    Delete FAQ
 * @access  Admin
 * @params
 *   - faqId: FAQ ID
 * @example
 *   DELETE /api/faqs/64a1b2c3d4e5f6789012345
 */
router.delete("/:faqId", deleteFAQ);

export default router;
