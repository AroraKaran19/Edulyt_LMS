import mongoose, { Schema } from "mongoose";
import { AuthenticationMedia } from "../types/authentication-media";
import { validateUrl } from "./validators";

const authenticationMediaSchema = new Schema<AuthenticationMedia>(
  {
    imageUrl: {
      type: String,
      required: true,
      validate: {
        validator: validateUrl,
        message: "Image URL must be a valid URL",
      },
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    link: {
      type: String,
      required: false,
      validate: {
        validator: function (value: string) {
          return !value || validateUrl(value);
        },
        message: "Link must be a valid URL",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient queries
authenticationMediaSchema.index({ order: 1 });
authenticationMediaSchema.index({ createdAt: -1 });

const AuthenticationMediaModel = mongoose.model<AuthenticationMedia>(
  "AuthenticationMedia",
  authenticationMediaSchema
);

export default AuthenticationMediaModel;

