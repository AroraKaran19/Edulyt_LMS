import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const sections = [
    {
        title: "Be authentic",
        body: "Share your own story in your own words. Real journeys, including the rough edges, help other learners more than polished, generic advice. Plagiarism, fabricated experiences, or AI-generated filler will be removed.",
    },
    {
        title: "Be respectful",
        body: "Disagree with ideas, never with people. No personal attacks, harassment, hate speech, slurs, or targeted negativity toward individuals, companies, colleges, or communities.",
    },
    {
        title: "Stay relevant",
        body: "Pick the tag that best matches your story (Career Switch, Interviews, Projects, Campus Placements, Freshers, On Job, Internships, Articles). Off-topic posts will be moved or removed.",
    },
    {
        title: "No promotions or spam",
        body: "Don't use the community to sell services, recruit, drive traffic to paid courses, push referral links, or repost the same content across tags. Linking to your own writing is fine when it adds context.",
    },
    {
        title: "Protect privacy",
        body: "Don't share other people's names, emails, phone numbers, salaries tied to identifiable individuals, or screenshots of private chats. Use anonymous mode if you'd rather not attach your name to a story.",
    },
    {
        title: "Be honest about money and offers",
        body: "Share salary ranges, package details, and offer specifics only if they're your own and you're comfortable making them public. Don't speculate about other people's compensation.",
    },
    {
        title: "Replies and discussion",
        body: "Reply to add value, ask a clarifying question, share a related experience, or offer a tip. One-word replies, low-effort jokes, and pile-ons are discouraged.",
    },
    {
        title: "Moderation",
        body: "Posts and replies that violate these guidelines may be hidden or removed without notice. Repeat violations can lead to losing posting privileges. If you see something off, flag it.",
    },
];

const CommunityGuidelinesPage = () => {
    return (
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
            <Link
                href="/community"
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 mb-6"
            >
                <ChevronLeft className="size-4" />
                Back to community
            </Link>

            <h1 className="text-3xl sm:text-4xl font-bold text-black">
                Community <span className="text-[#F77124]">Guidelines</span>
            </h1>
            <p className="mt-3 text-gray-500 text-sm sm:text-base">
                The community works best when stories are honest, kind, and
                useful. A few ground rules to keep it that way.
            </p>

            <div className="mt-10 space-y-6">
                {sections.map((s) => (
                    <section
                        key={s.title}
                        className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm"
                    >
                        <h2 className="text-base sm:text-lg font-bold text-black">
                            {s.title}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                            {s.body}
                        </p>
                    </section>
                ))}
            </div>

            <p className="mt-10 text-xs text-gray-400">
                These guidelines may evolve as the community grows. Last
                reviewed: May 2026.
            </p>
        </div>
    );
};

export default CommunityGuidelinesPage;
