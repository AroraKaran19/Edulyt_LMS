"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import CommunityHeader from "./components/CommunityHeader";
import ExperienceForm from "./components/ExperienceForm";
import ProfileSidebar from "./components/ProfileSidebar";
import useCommunityReview, {
  COMMUNITY_REVIEW_TAGS,
  type CommunityReviewTag,
} from "@/hooks/useCommunityReview";

const NewCommunityPostPage = () => {
  const router = useRouter();
  const { createReview } = useCommunityReview();

  const [tag, setTag] = useState<CommunityReviewTag | "">("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!tag) {
      toast.error("Please pick a category.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please add a title.");
      return;
    }
    if (!content.trim()) {
      toast.error("Please write your story.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createReview({
        title: title.trim(),
        review: content.trim(),
        tag,
        anonymous,
      });
      toast.success("Your post has been shared with the community!");
      router.push("/community");
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.serverMessage ||
        "Could not publish your post. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 md:px-18 px-4 ">
      <CommunityHeader />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-12 items-start">
        <div className="lg:col-span-8">
          <ExperienceForm
            tag={tag}
            onTagChange={setTag}
            title={title}
            onTitleChange={setTitle}
            content={content}
            onContentChange={setContent}
            anonymous={anonymous}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            tagOptions={[...COMMUNITY_REVIEW_TAGS]}
          />
        </div>

        <div className="lg:col-span-4 sticky top-24">
          <ProfileSidebar
            anonymous={anonymous}
            onAnonymousChange={setAnonymous}
          />
        </div>
      </div>
    </div>
  );
};

export default NewCommunityPostPage;
