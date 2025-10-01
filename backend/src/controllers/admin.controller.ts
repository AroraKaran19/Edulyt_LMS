import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import { UserModel } from "../models/user.schema";
import bcrypt from "bcryptjs";

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, filter = "" } = req.query;
  if (Number(page) < 1 || Number(limit) < 1) {
    throw new AppError("Page and limit must be positive numbers", 400);
  }
  if (Number(limit) > 100) {
    throw new AppError("Limit cannot exceed 100 items per page", 400);
  }
  const query: any = {};
  if (filter && String(filter).trim() !== "") {
    query.name = { $regex: filter, $options: "i" };
  }

  const users = await UserModel.find(query)
    .select('-password -refreshTokens -__v')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

  const total = await UserModel.countDocuments(query);
  const totalPages = Math.ceil(total / Number(limit));
  sendSuccessResponse(
    res,
    { users, total, totalPages },
    "Users fetched successfully",
    200
  );
});

export const getUsersSummary = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  if (Number(page) < 1 || Number(limit) < 1) {
    throw new AppError("Page and limit must be positive numbers", 400);
  }
  if (Number(limit) > 100) {
    throw new AppError("Limit cannot exceed 100 items per page", 400);
  }
  
  const query: any = {};
  if (search && String(search).trim() !== "") {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  const users = await UserModel.find(query)
    .select('firstName lastName userType status _id email profilePicture provider permissions orders createdAt')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

  const total = await UserModel.countDocuments(query);
  const totalPages = Math.ceil(total / Number(limit));
  
  sendSuccessResponse(
    res,
    { users, total, totalPages },
    "Users summary fetched successfully",
    200
  );
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  const user = await UserModel.findById(id)
    .select('-password -refreshTokens -__v')
    .lean();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  sendSuccessResponse(
    res,
    { user },
    "User fetched successfully",
    200
  );
});


export const updateUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  // Check if user exists
  const existingUser = await UserModel.findById(id);
  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  // If password is being updated, hash it
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  // Remove sensitive fields that shouldn't be updated directly
  delete updateData.refreshTokens;
  delete updateData._id;
  delete updateData.createdAt;

  // Update the user
  const updatedUser = await UserModel.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens -__v');

  if (!updatedUser) {
    throw new AppError("Failed to update user", 500);
  }

  sendSuccessResponse(
    res,
    { user: updatedUser },
    "User updated successfully",
    200
  );
});

export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone, permissions = [] } = req.body;

  // Validate required fields
  if (!email || !password || !firstName || !lastName) {
    throw new AppError("Email, password, first name, and last name are required", 400);
  }

  // Check if user already exists
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin user
  const adminData = {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phone,
    userType: "admin",
    provider: "credentials",
    status: "active",
    permissions: permissions.length > 0 ? permissions : ["read", "write", "delete"],
    accounts: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const newAdmin = new UserModel(adminData);
  await newAdmin.save();

  // Return user without sensitive data
  const adminResponse = await UserModel.findById(newAdmin._id)
    .select('-password -refreshTokens -__v')
    .lean();

  sendSuccessResponse(
    res,
    { user: adminResponse },
    "Admin user created successfully",
    201
  );
});

export const deleteUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  // Check if user exists
  const existingUser = await UserModel.findById(id);
  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  // Prevent deletion of super-admin users
  if (existingUser.userType === "super-admin") {
    throw new AppError("Cannot delete super-admin users", 403);
  }

  // Delete the user
  await UserModel.findByIdAndDelete(id);

  sendSuccessResponse(
    res,
    { deletedUserId: id },
    "User deleted successfully",
    200
  );
});
