import React from 'react'
import { Phone, ArrowRight } from 'lucide-react'
import Image from 'next/image'

const CartDetails = () => {
    return (
        <div className="flex-4 bg-white rounded-3xl p-3">
            {/* Expert Guidance Section */}
            <div className="mb-2 p-3 bg-[#FFF5EF] border border-[#F77124] rounded-2xl shadow-[0px_0px_0px_2px_#F771243B]">
                <div className="flex items-start gap-3">
                    <div>
                        <Image src="/expert-guidance.svg" alt="Expert Guidance" width={42} height={42} />
                        <h3 className="text-base font-extrabold text-black my-2 font-plus-jakarta">Expert Guidance</h3>
                        <p className="text-sm font-normal text-black mb-2 font-plus-jakarta leading-relaxed">
                            Receive guidance and mentorship from seasoned professionals (having 10+ years of experience).
                        </p>
                    </div>
                </div>
            </div>

            {/* Live Projects & Tools Section */}
            <div className="mb-2 p-4">
                <div className="flex items-start gap-3">
                    <div>
                        <Image src="/live-projects-tools.svg" alt="Live Projects & Tools" width={42} height={42} />
                        <h3 className="text-base font-extrabold text-black my-2 font-plus-jakarta">Live Projects & Tools</h3>
                        <p className="text-sm font-normal text-black mb-2 font-plus-jakarta leading-relaxed">
                            Receive guidance and mentorship from seasoned professionals (having 10+ years of experience).
                        </p>
                    </div>
                </div>
            </div>

            {/* Career Development Section */}
            <div className="mb-2 p-4">
                <div className="flex items-start gap-3">
                    <div>
                        <Image src="/career-development.svg" alt="Career Development" width={42} height={42} />
                        <h3 className="text-base font-extrabold text-black my-2 font-plus-jakarta">Career Development</h3>
                        <p className="text-sm font-normal text-black mb-2 font-plus-jakarta leading-relaxed">
                            Receive guidance and mentorship from seasoned professionals (having 10+ years of experience).
                        </p>
                    </div>
                </div>
            </div>

            {/* Call back Button */}
            <button
                type="button"
                className="w-full flex items-center justify-center gap-2 border-2 border-[#F77124] text-[#F77124] font-bold font-plus-jakarta py-3 px-4 rounded-[18px] text-base hover:bg-orange-50 transition-colors cursor-pointer"
            >
                <Phone className="w-5 h-5" fill="#F77124" />
                <span>Call back</span>
                <ArrowRight className="w-6 h-6" />
            </button>
        </div>
    )
}

export default CartDetails