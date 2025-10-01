import { Router } from "express";
import dotenv from "dotenv";
import { 
  getAllUsers, 
  getUsersSummary, 
  getUserById, 
  updateUserById, 
  createAdmin, 
  deleteUserById 
} from "../controllers/admin.controller";
dotenv.config();

const router = Router();

// Get all users
router.get("/users", getAllUsers);

// Get users for admin dashboard
router.get("/users/show", getUsersSummary);

// Get user by id
router.get("/users/:id", getUserById);

// Update user by id
router.put("/users/:id", updateUserById);

// Create new admin user
router.post("/users/admin", createAdmin);

// Delete user by id
router.delete("/users/:id", deleteUserById);

export default router;
