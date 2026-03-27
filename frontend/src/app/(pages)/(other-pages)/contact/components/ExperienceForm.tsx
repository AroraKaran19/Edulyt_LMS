"use client";

import React, { useState } from "react";
import DropDown from "@/components/ui/dropdown/DropDown";
import Input from "@/components/ui/inputs/Input";
import { Bookmark, Eye } from "lucide-react";

const ExperienceForm = () => {
    const [category, setCategory] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const categories = [
        "Career Journey",
        "Interview Experience",
        "Academic Doubts",
        "Project Insights",
        "General Discussion",
    ];

    const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.08)] border border-gray-100 mb-6">
            <div className="space-y-6">
                {/* Category */}
                <DropDown
                    label="Category"
                    options={categories}
                    defaultValue="Select Category"
                    onChange={(e) => setCategory(e.target.value)}
                />

                {/* Title */}
                <Input
                    label="Title"
                    placeholder="Eg: Switched from Non- tech to Data analyst in 6 months"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                {/* Experience Content */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-black block mb-2">
                        Title
                    </label>
                    <div className="relative border bg-[#D9D9D926] border-gray-200 rounded-2xl p-4 min-h-[400px] flex flex-col">
                        <div className="border-b border-gray-100 pb-2 mb-4">
                            <h3 className="text-gray-400 font-medium">Title</h3>
                        </div>

                        <textarea
                            className="w-full grow resize-none outline-none text-gray-700 placeholder:text-gray-300"
                            placeholder="Write here....."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50 text-xs font-medium text-gray-500">
                            <span>Word count : {wordCount}</span>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span>Draft Saved</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                    <div className="flex items-center gap-6">
                        <button className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-semibold">
                            <Bookmark className="w-5 h-5 fill-black" />
                            Save
                        </button>
                        <button className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-semibold">
                            <Eye className="w-5 h-5" />
                            Preview
                        </button>
                    </div>

                    <button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-12 rounded-xl transition-all shadow-[0_4px_15px_rgba(249,115,22,0.3)]">
                        Post
                    </button>
                </div>

                <p className="text-[10px] text-gray-400 mt-4">
                    Please review our <span className="text-green-500 font-semibold cursor-pointer">Community Guidelines</span>
                </p>
            </div>
        </div>
    );
};

export default ExperienceForm;
