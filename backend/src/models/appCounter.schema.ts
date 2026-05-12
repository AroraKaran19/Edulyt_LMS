import mongoose from "mongoose";

/**
 * Single-collection counter store keyed by a string id (e.g. "internId").
 * Reads/writes go through `findOneAndUpdate` with `$inc`, which Mongo
 * guarantees as atomic per-document — so multiple concurrent allocators
 * never produce the same sequence number.
 */
const appCounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, _id: false },
);

export const AppCounterModel = mongoose.model("AppCounter", appCounterSchema);
