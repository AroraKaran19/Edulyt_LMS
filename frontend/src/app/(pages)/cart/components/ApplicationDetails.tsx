import { OrangeButton } from '@/components/ui'
import Image from 'next/image'
import React from 'react'

interface ApplicationDetailsProps {
    onNext: () => void;
  }

  const ApplicationDetails = ({ onNext }: ApplicationDetailsProps) => {
    return (
        <div className="flex-6 bg-white rounded-3xl p-6">
            {/* Enter Your Details Section */}
            <div className="mb-6">
                <h3 className="text-xl font-normal font-coolvetica text-[#2B1508] mb-2">Enter Your Details</h3>
                <p className="text-base text-[#2B1508] font-plus-jakarta font-normal mb-8">To enrol you have to enter your details</p>

                <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-bold text-black mb-2">Full Name</label>
                        <input
                            type="text"
                            placeholder="Enter your name here"
                            className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#00000026]  shadow-[0px_4px_10.7px_0px_#00000012_inset] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Email Address */}
                    <div>
                        <label className="block text-sm font-bold text-black mb-2">Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your email here"
                            className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#00000026]  shadow-[0px_4px_10.7px_0px_#00000012_inset] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-bold text-black mb-2">Phone Number</label>
                        <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center border border-[#00000026] rounded-xl py-2 px-4">
                                <Image src="/india-flag.svg" alt="India" width={30} height={30} />
                            </div>
                            <input
                                type="tel"
                                placeholder="Enter your number here"
                                className="flex-1 px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#00000026]  shadow-[0px_4px_10.7px_0px_#00000012_inset] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <hr className="bg-[#00000029] my-6 border-0 h-0.5" />

            {/* Enter Your Education Details Section */}
            <div className="mb-6">
                <h3 className="text-xl font-normal font-coolvetica text-[#2B1508] mb-2">Enter Your Education Details</h3>
                <p className="text-base text-[#2B1508] font-plus-jakarta font-normal mb-8">To enrol you have to enter your details</p>

                <div className="space-y-4">
                    {/* College Name */}
                    <div>
                        <label className="block text-sm font-bold text-black mb-2">College Name</label>
                        <input
                            type="text"
                            placeholder="Enter your college name here"
                            className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#00000026]  shadow-[0px_4px_10.7px_0px_#00000012_inset] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Degree Name */}
                    <div>
                        <label className="block text-sm font-bold text-black mb-2">Degree Name</label>
                        <input
                            type="email"
                            placeholder="Enter your degree name here"
                            className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#00000026]  shadow-[0px_4px_10.7px_0px_#00000012_inset] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Father Occupation */}
                    <div>
                        <label className="block text-sm font-bold text-black mb-2">Father Occupation</label>
                        <input
                            type="email"
                            placeholder="Enter your father occupation here"
                            className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#00000026]  shadow-[0px_4px_10.7px_0px_#00000012_inset] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Enroll Now Button */}
            <OrangeButton 
            className="w-full text-base font-bold py-3 px-6 font-plus-jakarta" 
            glow
            onClick={onNext}
            >
                Enroll now!
            </OrangeButton>
        </div>
        
    )
}

export default ApplicationDetails