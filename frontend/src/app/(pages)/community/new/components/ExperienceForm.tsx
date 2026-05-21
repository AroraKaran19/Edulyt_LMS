"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Eye, Pencil } from "lucide-react";
import DropDown from "@/components/ui/dropdown/DropDown";
import Input from "@/components/ui/inputs/Input";
import StoryCard from "@/app/(pages)/community/components/StoryCard";
import useAuth from "@/hooks/useAuth";
import type {
    CommunityReviewTag,
    PublicCommunityReview,
    PublicCommunityReviewUser,
} from "@/hooks/useCommunityReview";
import type { Student } from "@/types";

interface ExperienceFormProps {
    tag: CommunityReviewTag | "";
    onTagChange: (tag: CommunityReviewTag) => void;
    title: string;
    onTitleChange: (title: string) => void;
    content: string;
    onContentChange: (content: string) => void;
    anonymous: boolean;
    onSubmit: () => void;
    isSubmitting: boolean;
    tagOptions: string[];
}

const ExperienceForm = ({
    tag,
    onTagChange,
    title,
    onTitleChange,
    content,
    onContentChange,
    anonymous,
    onSubmit,
    isSubmitting,
    tagOptions,
}: ExperienceFormProps) => {
    const { user } = useAuth();
    const [isPreview, setIsPreview] = useState(false);

    const wordCount =
        content.trim() === "" ? 0 : content.trim().split(/\s+/).length;

    const previewStory = useMemo<PublicCommunityReview>(() => {
        const student = user as Partial<Student> | undefined;
        const previewUser: PublicCommunityReviewUser | undefined = anonymous
            ? undefined
            : {
                  _id: user?._id,
                  firstName: user?.firstName,
                  lastName: user?.lastName,
                  profilePicture: user?.profilePicture,
                  collegeName: student?.collegeName,
                  currentPosition: student?.currentPosition,
                  currentCompany: student?.currentCompany,
              };

        return {
            _id: "preview",
            userId: previewUser,
            title: title.trim(),
            review: content.trim(),
            tag: (tag || "Career Switch") as CommunityReviewTag,
            totalLikes: 0,
            hasLiked: false,
            repliesCount: 0,
            createdAt: new Date().toISOString(),
        };
    }, [user, anonymous, title, content, tag]);

    const handlePreviewToggle = () => {
        if (isPreview) {
            setIsPreview(false);
            return;
        }
        if (!tag || !title.trim() || !content.trim()) {
            toast.info("Add a category, title, and story before previewing.");
            return;
        }
        setIsPreview(true);
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.08)] border border-gray-100 mb-6">
            <div className="space-y-6">
                {isPreview ? (
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                            Preview
                        </p>
                        <StoryCard story={previewStory} />
                    </div>
                ) : (
                    <>
                        <DropDown
                            label="Category"
                            options={tagOptions}
                            defaultValue="Select Category"
                            value={tag || undefined}
                            onChange={(e) =>
                                onTagChange(
                                    e.target.value as CommunityReviewTag
                                )
                            }
                        />

                        <Input
                            label="Title"
                            placeholder="Eg: Switched from Non-tech to Data Analyst in 6 months"
                            value={title}
                            onChange={(e) => onTitleChange(e.target.value)}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-black block mb-2">
                                Your Story
                            </label>
                            <div className="relative border bg-[#D9D9D926] border-gray-200 rounded-2xl p-4 min-h-[400px] flex flex-col">
                                <div className="border-b border-gray-100 pb-2 mb-4">
                                    <h3 className="text-gray-400 font-medium">
                                        Share your experience
                                    </h3>
                                </div>

                                <textarea
                                    className="w-full grow resize-none outline-none text-gray-700 placeholder:text-gray-300"
                                    placeholder="Write here....."
                                    value={content}
                                    onChange={(e) =>
                                        onContentChange(e.target.value)
                                    }
                                />

                                <div className="flex justify-end items-center mt-4 pt-4 border-t border-gray-50 text-xs font-medium text-gray-500">
                                    <span>Word count : {wordCount}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                    <button
                        type="button"
                        onClick={handlePreviewToggle}
                        className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-semibold"
                    >
                        {isPreview ? (
                            <>
                                <Pencil className="w-5 h-5" />
                                Edit
                            </>
                        ) : (
                            <>
                                <Eye className="w-5 h-5" />
                                Preview
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-bold py-3 px-12 rounded-xl transition-all shadow-[0_4px_15px_rgba(249,115,22,0.3)]"
                    >
                        {isSubmitting ? "Posting…" : "Post"}
                    </button>
                </div>

                <p className="text-[10px] text-gray-400 mt-4">
                    Please review our{" "}
                    <Link
                        href="/community/guidelines"
                        className="text-green-500 font-semibold hover:underline"
                    >
                        Community Guidelines
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ExperienceForm;
