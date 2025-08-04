import { model, Schema } from "mongoose";

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "instructor", "student", "moderator", "third-party"],
    default: "student",
    required: true,
  },
});

export default model("User", userSchema);