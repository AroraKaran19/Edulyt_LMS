import { AppError } from "../middlewares/error.middleware";
import {
  CollaboratorModel,
  InstructorModel,
  StudentModel,
  UserModel,
} from "../models";
import { User } from "../types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (userData: Partial<User>) => {
  const hashedPassword = await bcrypt.hash(userData.password!, 10);
  const newUserData: Partial<User> = {
    ...userData,
    password: hashedPassword,
  };

  try {
    let newUser: any;
    switch (newUserData.userType) {
      case "student":
        newUser = new StudentModel(newUserData);
        break;
      case "instructor":
        newUser = new InstructorModel(newUserData);
        break;
      case "collaborator":
        newUser = new CollaboratorModel(newUserData);
        break;
      default:
        newUser = new StudentModel(newUserData);
        break;
    }
    await newUser.save();
    return newUser;
  } catch (error) {
    throw new AppError("Internal server error", 500);
  }
};

export const loginUser = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.provider !== "credentials") {
    throw new AppError(
      `User is registered with ${user.provider.toUpperCase()}!`,
      401
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  // Remove password from the returned user object
  const userWithoutPassword = user.toObject();
  delete (userWithoutPassword as any).password;

  return userWithoutPassword;
};

export const oauthSignIn = async (
  email: string,
  firstName: string,
  lastName: string,
  provider: User["provider"],
  userType = "student" as User["userType"],
  profilePicture: string
) => {
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      const newUser = await registerUser({
        email,
        firstName,
        lastName,
        provider,
        userType,
        profilePicture,
      });
      return newUser;
    }

    if (user.provider !== provider) {
      throw new AppError(
        `User is registered with ${user.provider.toUpperCase()}!`,
        401
      );
    }

    return user;
  } catch (error) {
    throw new AppError("Internal server error", 500);
  }
};

export const logoutUser = async (userId: string) => {
  try {
    await UserModel.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] },
    });
  } catch (error) {
    throw new AppError("Internal server error", 500);
  }
};

export const cleanupExpiredTokens = async () => {
  try {
    // Remove expired tokens from all users without deleting the user documents
    await UserModel.updateMany(
      {
        "refreshTokens.expiresAt": { $lt: new Date() }
      },
      {
        $pull: {
          refreshTokens: {
            expiresAt: { $lt: new Date() }
          }
        }
      }
    );
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
  }
};

export const resetUserPassword = async (token: string, newPassword: string) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not set", 500);
  }

  // Verify the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
    userId: string;
    email: string;
  };

  if (!decoded.userId || !decoded.email) {
    throw new AppError("Invalid token", 400);
  }

  const user = await UserModel.findById(decoded.userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  await (UserModel as any).resetPassword(decoded.userId, newPassword);
};

export const changeUserPassword = async (
  userId: string,
  newPassword: string,
  oldPassword: string
) => {
  const user = await UserModel.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
};
