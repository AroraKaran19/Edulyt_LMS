import React from 'react';
import { Linkedin } from 'lucide-react';
import Image from 'next/image';

const ProfileCard = () => {
    return (
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0,05)] border border-gray-100 mb-6">
            <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm">
                    <Image
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop"
                        alt="Arjun Mehta"
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-black leading-tight">Arjun Mehta</h2>
                    <p className="text-sm font-semibold text-gray-800">National College of Engineering</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Senior Manager at <span className="text-orange-500 font-bold">Bank of America</span>
                    </p>

                    <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-500 hover:text-blue-600 transition-colors cursor-pointer">
                        <div className="bg-[#0077b5] p-1 rounded-sm">
                            <Linkedin className="w-2.5 h-2.5 text-white fill-white" />
                        </div>
                        <span>Linkedin.com/in/arjunmenta</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
