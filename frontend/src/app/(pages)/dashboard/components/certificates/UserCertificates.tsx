"use client";
import React, { useState } from "react";
import { Search, Filter, Download } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import EmptyState from "../applications/EmptyState";

const UserCertificates = () => {
    const [activeTab, setActiveTab] = useState("All");
    const [search, setSearch] = useState("");
    const router = useRouter();

    const tabs = [
        { label: "All" },
        { label: "Recent" }
    ];

    const handleCertificateClick = (certificateId: string) => {
        router.push(`/dashboard/certificates/${certificateId}`);
    };

    // Mock data - replace with actual certificates array
    const certificates = Array.from({ length: 8 }, (_, idx) => {
        const course: any = {} as any;
        const certificateId = `cert-${idx + 1}`;
        return { course, certificateId };
    });

    return (
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-20 pb-4">
            {/* Conditional rendering based on certificates array length */}
            {certificates.length === 0 ? (
                <EmptyState title="Certificates" />
            ) : (
                <>
                    {/* Header and Tabs */}
                    <div className="flex flex-col mb-4 sm:mb-6">
                        <div>
                            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                                My Certificates
                            </h1>
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                                <div className="flex gap-1 sm:gap-2 rounded-xl border border-[#F66F221F] bg-[#FFF6F2] p-1 sm:px-2 sm:py-1 overflow-x-auto">
                                    {tabs.map((tab) => (
                                        <button
                                            type="button"
                                            title={tab.label}
                                            key={tab.label}
                                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.label
                                                ? "bg-orange-500 text-white shadow"
                                                : "text-black hover:bg-gray-200"
                                                }`}
                                            onClick={() => setActiveTab(tab.label)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Search, Filter, Sort */}
                                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full lg:w-auto">
                                    <div className="relative order-1 sm:order-none">
                                        <input
                                            type="text"
                                            placeholder="Search a certificate by its name or course name"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="placeholder:text-[#0000003D] placeholder:text-xs w-full sm:w-[240px] md:w-[320px] lg:w-[380px] h-10 sm:h-12 px-3 sm:px-4 pr-10 sm:pr-12 bg-[#F5F5F5] rounded-xl border border-[#00000026] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-[0px_4px_4px_0px_#00000012_inset]"
                                        />
                                        <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 p-1.5 sm:p-2 rounded-lg hover:bg-orange-600 transition" title="Search">
                                            <Search className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2 order-2 sm:order-none">
                                        <button type="button" className="flex items-center gap-1 border border-[#00000026] rounded-xl px-3 sm:px-4 md:px-5 py-2 sm:py-3 text-xs sm:text-sm font-bold text-[#2B1508] hover:bg-gray-200 cursor-pointer">
                                            <span className="hidden sm:inline">Filter</span>
                                            <span className="sm:hidden">Filter</span>
                                            <Filter size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        </button>
                                        <button type="button" className="flex items-center gap-1 border border-[#00000026] rounded-xl px-3 sm:px-4 md:px-5 py-2 sm:py-3 text-xs sm:text-sm font-bold text-[#2B1508] hover:bg-gray-200 cursor-pointer">
                                            <span className="hidden sm:inline">Sort by</span>
                                            <span className="sm:hidden">Sort</span>
                                            <Image src="/sort.svg" alt="sort" width={16} height={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                        {certificates.map(({ course, certificateId }, idx) => (
                            // certificate card
                            <div
                                key={`${course._id}-${idx}`}
                                className="bg-white border border-[#0000001F] rounded-xl flex flex-col justify-between p-3 sm:p-4 w-full shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleCertificateClick(certificateId)}
                            >
                                <div>
                                    <div className="relative w-full h-24 xs:h-28 sm:h-32 md:h-36 rounded-xl overflow-hidden mb-2 sm:mb-3 pt-2 sm:pt-4 px-2 sm:px-3 border border-[#00000017]">
                                        <Image src="/certificates-user-icon.svg"
                                            alt="certificate" width={259} height={188}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="font-extrabold text-xs sm:text-sm mb-2 text-black line-clamp-2 leading-tight">
                                        Data Science: Zero to Hundred
                                    </div>
                                    <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
                                        <div className="bg-[#EEEEEE] rounded-[34px] p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                            <Image src="/user.svg" alt="user" width={16} height={16} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border border-white" />
                                            <span className="text-xs sm:text-sm text-gray-700 font-medium hidden sm:inline">John Doe</span>
                                            <span className="text-xs sm:text-sm text-gray-700 font-medium sm:hidden">JD</span>
                                        </div>
                                        <div className="bg-[#EEEEEE] rounded-[34px] p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                            <Image src="/user.svg" alt="user" width={16} height={16} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border border-white" />
                                            <span className="text-xs sm:text-sm text-gray-700 font-medium hidden sm:inline">John Doe</span>
                                            <span className="text-xs sm:text-sm text-gray-700 font-medium sm:hidden">JD</span>
                                        </div>
                                        <div className="bg-[#EEEEEE] rounded-[34px] p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                            <span className="text-xs sm:text-sm text-gray-700 font-medium m-[2px]">+1</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="flex justify-center items-center gap-1 sm:gap-2 mt-2 sm:mt-3 bg-white border border-[#00000021] text-[#656565] rounded-lg px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs font-bold hover:bg-gray-100 transition cursor-pointer shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <Download size={14} className="sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Download certificate</span>
                                    <span className="sm:hidden">Download</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default UserCertificates