// ===================
// User-related types for Edulyt platform
// ===================

// ===================
// Main User Type
// ===================

export interface User {
  // Core user information
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  lastLogout?: Date;
}