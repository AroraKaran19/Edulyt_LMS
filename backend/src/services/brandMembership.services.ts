import mongoose from "mongoose";
import { UserModel } from "../models";
import { DEFAULT_BRAND, type Brand } from "../constants/brands";

/**
 * One atomic, idempotent write, so a double-submitted join cannot race.
 * A pipeline rather than $addToSet: on an account whose `brands` was never set,
 * $addToSet would store only the new brand and drop the Airkrit membership that
 * account implicitly holds.
 */
export const addBrandMembership = async (
  userId: mongoose.Types.ObjectId | string,
  brand: Brand,
): Promise<void> => {
  await UserModel.updateOne(
    {
      _id: userId,
      ...(brand === DEFAULT_BRAND ? {} : { userType: { $ne: "partner" } }),
    },
    [
      {
        $set: {
          brands: {
            $setUnion: [{ $ifNull: ["$brands", [DEFAULT_BRAND]] }, [brand]],
          },
        },
      },
    ],
  );
};
