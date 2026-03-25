"use client";

import React, { useState } from 'react';
import { cn } from "@/lib/utils";

const AnonymousToggle = () => {
    const [isAnonymous, setIsAnonymous] = useState(false);

    return (
        <div className="bg-white shadow-[0_4px_25px_rgba(0,0,0,0.08)] rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0,05)] border border-gray-100">
            <h3 className="text-sm font-bold text-black mb-4">Anonymous Post</h3>

            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">Post Anonymously</span>

                <button
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={cn(
                        "relative w-12 h-6 rounded-full transition-colors duration-200 outline-none",
                        isAnonymous ? "bg-orange-500" : "bg-gray-300"
                    )}
                >
                    <div className={cn(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm",
                        isAnonymous ? "translate-x-6" : "translate-x-0"
                    )} />
                </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                Your Identity will not be visible publicly
            </p>
        </div>
    );
};

export default AnonymousToggle;
