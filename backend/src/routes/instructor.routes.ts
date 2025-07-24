import { Router } from 'express';
import { InstructorController } from '../controllers/instructor.controller';

const router = Router();
const instructorController = new InstructorController();

/**
 * @route   GET /api/instructors
 * @desc    Get all instructors with pagination and search
 * @access  Public
 * @params  
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - search: Search by instructor name (optional)
 * @example 
 *   GET /api/instructors?page=1&limit=10&search=john
 */
router.get('/', instructorController.getAllInstructors);

/**
 * @route   GET /api/instructors/top
 * @desc    Get top rated instructors
 * @access  Public
 * @params  
 *   - limit: Number of instructors to return (default: 10)
 * @example 
 *   GET /api/instructors/top?limit=5
 */
router.get('/top', instructorController.getTopInstructors);

/**
 * @route   GET /api/instructors/:instructorId
 * @desc    Get instructor by ID
 * @access  Public
 * @params  
 *   - instructorId: Instructor ID (URL parameter)
 * @example 
 *   GET /api/instructors/instructor-123
 */
router.get('/:instructorId', instructorController.getInstructorById);

/**
 * @route   POST /api/instructors
 * @desc    Create new instructor
 * @access  Private (Admin only)
 * @body    Instructor data object
 * @example 
 *   POST /api/instructors
 *   Body: { 
 *     name: "John Doe", 
 *     experience: "5 years", 
 *     bio: "Experienced developer...",
 *     linkedinUrl: "https://linkedin.com/in/johndoe"
 *   }
 */
router.post('/', instructorController.createInstructor);

/**
 * @route   PUT /api/instructors/:instructorId
 * @desc    Update instructor by ID
 * @access  Private (Admin only)
 * @params  
 *   - instructorId: Instructor ID (URL parameter)
 * @body    Instructor data object
 * @example 
 *   PUT /api/instructors/instructor-123
 *   Body: { name: "Updated Name", bio: "Updated bio..." }
 */
router.put('/:instructorId', instructorController.updateInstructor);

/**
 * @route   DELETE /api/instructors/:instructorId
 * @desc    Delete instructor by ID
 * @access  Private (Admin only)
 * @params  
 *   - instructorId: Instructor ID (URL parameter)
 * @example 
 *   DELETE /api/instructors/instructor-123
 */
router.delete('/:instructorId', instructorController.deleteInstructor);

export { router as instructorRoutes }; 