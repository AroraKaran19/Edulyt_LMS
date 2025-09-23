import { OrangeButton } from '@/components/ui'
import Image from 'next/image'
import React from 'react'

interface TermsConditionsProps {
    onNext: () => void;
  }

const TermsConditions = ({ onNext }: TermsConditionsProps) => {
    return (
        <div className="flex-6 bg-white rounded-3xl p-6">
            {/* Terms & Conditions Header */}
            <div className="mb-6">
                <h3 className="text-2xl font-normal font-coolvetica text-[#2B1508] mb-2">Terms & Conditions</h3>
                <p className="text-base text-[#2B1508] font-plus-jakarta font-normal mb-8">Read or download our terms and confitions.</p>

                {/* Document Preview Frame */}
                <div className="w-full h-96 bg-[#FAFAFA] border border-[#00000026] rounded-[18px] mb-6 overflow-hidden">
                    <div className="w-full h-ful px-7 pt-7">
                        <Image src="/t&c-demo-image.png" alt="Terms & Conditions" width={1000} height={1000} />
                    </div>
                </div>

                {/* Agree Checkbox */}
                <div className="flex items-center gap-3 mb-6">
                    <input
                        type="checkbox"
                        id="agree-terms"
                        className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                    />
                    <label htmlFor="agree-terms" className="text-sm font-medium text-black">
                        Agree and continue
                    </label>
                </div>
            </div>

            {/* Continue Button */}
            <OrangeButton 
            className="w-full text-base font-bold py-4 px-6 font-plus-jakarta" 
            glow
            onClick={onNext}
            >
                Continue
            </OrangeButton>
        </div>
    )
}

export default TermsConditions