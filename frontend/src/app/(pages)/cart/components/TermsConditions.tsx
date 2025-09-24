"use client";
import { OrangeButton } from '@/components/ui'
import React, { useState } from 'react'

interface TermsConditionsProps {
    onNext: () => void;
  }

const TermsConditions = ({ onNext }: TermsConditionsProps) => {
    const [agreed, setAgreed] = useState(false);
    const [showError, setShowError] = useState(false);
    const pdfUrl = '/course-certificates/Certificates/Airkrit India Course Certificate - AI-01171 - Template.pdf';

    const handleContinue = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!agreed) {
            e.preventDefault();
            setShowError(true);
            return;
        }
        onNext();
    };

    return (
        <div className="flex-6 bg-white rounded-3xl p-6">
            {/* Terms & Conditions Header */}
            <div className="mb-6">
                <h3 className="text-2xl font-normal font-coolvetica text-[#2B1508] mb-2">Terms & Conditions</h3>
                <p className="text-base text-[#2B1508] font-plus-jakarta font-normal mb-4">Read or download our terms and confitions.</p>

                {/* Document Preview Frame */}
                <div className="w-full h-96 bg-[#FAFAFA] border border-[#00000026] rounded-[18px] mb-3 overflow-hidden">
                    <iframe
                        src={encodeURI(pdfUrl)}
                        title="Terms & Conditions PDF"
                        className="w-full h-full"
                        loading="lazy"
                    />
                </div>

                {/* Agree Checkbox */}
                <div className="flex items-center gap-3 mb-1">
                    <input
                        type="checkbox"
                        id="agree-terms"
                        className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                        checked={agreed}
                        onChange={(e) => {
                            setAgreed(e.target.checked);
                            if (showError) setShowError(false);
                        }}
                        aria-invalid={showError && !agreed}
                    />
                    <label htmlFor="agree-terms" className="text-sm font-medium text-black">
                        Agree and continue
                    </label>
                </div>
                {showError && !agreed && (
                    <p className="text-xs text-red-600 font-plus-jakarta mt-1">You must agree to continue.</p>
                )}
            </div>

            {/* Continue Button */}
            <OrangeButton 
            className="w-full text-base font-bold py-4 px-6 font-plus-jakarta" 
            glow
            disabled={!agreed}
            onClick={handleContinue}
            >
                Continue
            </OrangeButton>
        </div>
    )
}

export default TermsConditions