import { Request, Response } from "express";
import userSchema from "../models/user.schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Register a new user
 * @param req - Express request object
 * @param res - Express response object
 */
export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, confirmPassword } = req.body;
      const existingUser = await userSchema.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      const user = await userSchema.create({ email, password });
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
      });
      return res
        .status(201)
        .json({ message: "User created successfully", user });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await userSchema.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      return res.status(200).json({ message: "Login successful", user });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};
