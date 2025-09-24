import DropDown from '@/components/ui/dropdown/DropDown'
import { OrangeButton } from '@/components/ui'
import { Cross } from 'lucide-react'
import React, { useState } from 'react'

const EnrollmentDetails = () => {
    const [formData, setFormData] = useState({
        learningFormat: '',
        programmingLanguages: '',
        batchNumber: '',
        selectedLanguages: [] as string[]
    });
    
    const [errors, setErrors] = useState({
        learningFormat: '',
        programmingLanguages: '',
        batchNumber: '',
        selectedLanguages: ''
    });

    const languages = [
        { name: 'Product Designer', value: 'product-designer' },
        { name: 'UI/UX Design', value: 'ui-ux-design' },
        { name: 'Graphic Designer', value: 'graphic-designer' },
        { name: 'Figma', value: 'figma' },
        { name: 'Photoshop', value: 'photoshop' },
        { name: 'Illustrator', value: 'illustrator' },
    ];  

    const programmingLanguageOptions = [
        'Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin'
    ];

    const batchOptions = [
        'Batch 1 (Jan 2024)', 'Batch 2 (Feb 2024)', 'Batch 3 (Mar 2024)', 
        'Batch 4 (Apr 2024)', 'Batch 5 (May 2024)', 'Batch 6 (Jun 2024)'
    ];

    const validateForm = () => {
        const newErrors = {
            learningFormat: '',
            programmingLanguages: '',
            batchNumber: '',
            selectedLanguages: ''
        };

        if (!formData.learningFormat || formData.learningFormat === '-Select a type-') {
            newErrors.learningFormat = 'Please select a learning format';
        }

        if (!formData.programmingLanguages || formData.programmingLanguages === '-Select a type-') {
            newErrors.programmingLanguages = 'Please select programming languages';
        }

        if (!formData.batchNumber || formData.batchNumber === '-Select a type-') {
            newErrors.batchNumber = 'Please select a batch number';
        }

        if (formData.selectedLanguages.length === 0) {
            newErrors.selectedLanguages = 'Please select at least one language';
        }

        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const handleLanguageToggle = (languageValue: string) => {
        setFormData(prev => {
            const isSelected = prev.selectedLanguages.includes(languageValue);
            const newSelectedLanguages = isSelected 
                ? prev.selectedLanguages.filter(lang => lang !== languageValue)
                : [...prev.selectedLanguages, languageValue];
            
            return { ...prev, selectedLanguages: newSelectedLanguages };
        });
        
        // Clear language error when user selects a language
        if (errors.selectedLanguages) {
            setErrors(prev => ({ ...prev, selectedLanguages: '' }));
        }
    };

    const handleEnroll = () => {
        if (validateForm()) {
            // Handle enrollment logic here
            console.log('Enrollment data:', formData);
            alert('Enrollment successful!');
        }
    };

    const isFormValid = formData.learningFormat && 
                       formData.learningFormat !== '-Select a type-' &&
                       formData.programmingLanguages && 
                       formData.programmingLanguages !== '-Select a type-' &&
                       formData.batchNumber && 
                       formData.batchNumber !== '-Select a type-' &&
                       formData.selectedLanguages.length > 0;

    return (
        // <div className="mb-6">
        <div className="flex-6 bg-white rounded-3xl p-6">
            <h3 className="text-xl font-normal font-coolvetica text-[#2B1508] mb-2">Enrolment</h3>
            <p className="text-base text-[#2B1508] font-plus-jakarta font-normal mb-8">Select your enrolment preferences.</p>

            <div className="space-y-4">
                {/*Learning Format */}
                <div>
                    <label className="block text-sm font-bold text-black mb-2">Learning Format</label>
                    <DropDown
                        name="learningFormat"
                        options={["Online", "Offline"]}
                        defaultValue="-Select a type-"
                        value={formData.learningFormat}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, learningFormat: e.target.value }));
                            if (errors.learningFormat) {
                                setErrors(prev => ({ ...prev, learningFormat: '' }));
                            }
                        }}
                        required
                    />
                    {errors.learningFormat && (
                        <p className="text-xs text-red-600 font-plus-jakarta mt-1">{errors.learningFormat}</p>
                    )}
                </div>

                {/* Programming Languages */}
                <div>
                    <label className="block text-sm font-bold text-black mb-2">Programming Languages</label>
                    <DropDown
                        name="programmingLanguages"
                        options={programmingLanguageOptions}
                        defaultValue="-Select a type-"
                        value={formData.programmingLanguages}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, programmingLanguages: e.target.value }));
                            if (errors.programmingLanguages) {
                                setErrors(prev => ({ ...prev, programmingLanguages: '' }));
                            }
                        }}
                        required
                    />
                    {errors.programmingLanguages && (
                        <p className="text-xs text-red-600 font-plus-jakarta mt-1">{errors.programmingLanguages}</p>
                    )}
                </div>

                {/* Languages */}
                <div>
                    <label className="block text-sm font-bold text-black mb-2">Languages</label>
                    <div className="flex flex-wrap gap-2">
                        {languages.map((language) => {
                            const isSelected = formData.selectedLanguages.includes(language.value);
                            return (
                                <button 
                                    type='button' 
                                    className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-colors ${
                                        isSelected 
                                            ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                                            : 'bg-[#F3F3F3] text-[#575757] hover:bg-gray-200'
                                    }`} 
                                    key={language.value}
                                    onClick={() => handleLanguageToggle(language.value)}
                                >
                                    <span className='font-plus-jakarta font-medium text-base leading-[173%]'>{language.name}</span>
                                    {isSelected && (
                                        <Cross className='w-3 h-3 text-orange-700 cursor-pointer rotate-45' fill='#F77124' />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {errors.selectedLanguages && (
                        <p className="text-xs text-red-600 font-plus-jakarta mt-1">{errors.selectedLanguages}</p>
                    )}
                </div>

                {/* Batch number */}
                <div>
                    <label className="block text-sm font-bold text-black mb-2">Batch number</label>
                    <DropDown
                        name="batchNumber"
                        options={batchOptions}
                        defaultValue="-Select a type-"
                        value={formData.batchNumber}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, batchNumber: e.target.value }));
                            if (errors.batchNumber) {
                                setErrors(prev => ({ ...prev, batchNumber: '' }));
                            }
                        }}
                        required
                    />
                    {errors.batchNumber && (
                        <p className="text-xs text-red-600 font-plus-jakarta mt-1">{errors.batchNumber}</p>
                    )}
                </div>

                <div className='w-full flex justify-between mt-8'>
                    <div className='flex flex-col gap-1'>
                        <p className='text-sm font-plus-jakarta font-bold text-[#2B150899]'>Total price</p>
                        <p className='text-xl font-plus-jakarta font-bold text-[#000000]'>$100</p>
                    </div>
                    <OrangeButton 
                        className="text-base font-bold py-0 px-12 font-plus-jakarta" 
                        glow
                        disabled={!isFormValid}
                        onClick={handleEnroll}
                    >
                        Enroll now!
                    </OrangeButton>
                </div>
            </div>
        </div>)
}

export default EnrollmentDetails