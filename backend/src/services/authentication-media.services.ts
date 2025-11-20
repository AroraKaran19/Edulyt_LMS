import AuthenticationMediaModel from "../models/authentication-media.schema";
import {
  AuthenticationMedia,
  CreateAuthenticationMediaData,
  UpdateAuthenticationMediaData,
} from "../types/authentication-media";

export const getAllAuthenticationMediaService = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  media: AuthenticationMedia[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  const media = await AuthenticationMediaModel.find({})
    .skip(skip)
    .limit(limit)
    .sort({ order: 1, createdAt: -1 });

  const total = await AuthenticationMediaModel.countDocuments({});

  const totalPages = Math.ceil(total / limit);

  return {
    media,
    total,
    totalPages,
    page,
  };
};

export const getAuthenticationMediaByIdService = async (
  id: string
): Promise<AuthenticationMedia | null> => {
  const media = await AuthenticationMediaModel.findById(id);

  if (!media) {
    return null;
  }

  return media as AuthenticationMedia;
};

export const createAuthenticationMediaService = async (
  mediaData: CreateAuthenticationMediaData
): Promise<AuthenticationMedia | null> => {
  const newMedia = new AuthenticationMediaModel(mediaData);
  const savedMedia = await newMedia.save();
  return savedMedia as AuthenticationMedia;
};

export const updateAuthenticationMediaService = async (
  id: string,
  updateData: UpdateAuthenticationMediaData
): Promise<AuthenticationMedia | null> => {
  const updatedMedia = await AuthenticationMediaModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedMedia) {
    return null;
  }

  return updatedMedia as AuthenticationMedia;
};

export const deleteAuthenticationMediaService = async (
  id: string
): Promise<boolean> => {
  const result = await AuthenticationMediaModel.findByIdAndDelete(id);
  return !!result;
};

export const reorderAuthenticationMediaService = async (
  mediaIds: string[]
): Promise<AuthenticationMedia[]> => {
  const bulkOps = mediaIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order: index } },
    },
  }));

  await AuthenticationMediaModel.bulkWrite(bulkOps);

  const updatedMedia = await AuthenticationMediaModel.find({
    _id: { $in: mediaIds },
  }).sort({ order: 1 });

  return updatedMedia as AuthenticationMedia[];
};

