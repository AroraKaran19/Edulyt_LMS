import DropDown from '@/components/ui/dropdown/DropDown'
import { OrangeButton } from '@/components/ui'
import { Cross } from 'lucide-react'
import React from 'react'

const EnrollmentDetails = () => {
    const languages = [
        {
            name: 'Product Designer',
            value: 'product-designer'
        },

        {
            name: 'UI/UX Design',
            value: 'ui-ux-design'
        },
        {
            name: 'Graphic Designer',
            value: 'graphic-designer'
        },
        {
            name: 'Figma',
            value: 'figma'
        },
        {
            name: 'Photoshop',
            value: 'photoshop'
        },
        {
            name: 'Illustrator',
            value: 'illustrator'
        },
    ]
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
                        name="targetAudience"
                        options={["Online", "Offline"]}
                        defaultValue="-Select a type-"
                        // value={
                        //     state.course.audience === "college-students"
                        //         ? "College Students"
                        //         : state.course.audience === "professionals"
                        //             ? "Professionals"
                        //             : "Select a target audience"
                        // }
                        // onChange={(e) => {
                        //     const technicalValue =
                        //         e.target.value === "College Students"
                        //             ? "college-students"
                        //             : "professionals";
                        //     actions.setCourseAudience(technicalValue);
                        // }}
                        required
                    />
                </div>

                {/* Programming Languages */}
                <div>
                    <label className="block text-sm font-bold text-black mb-2">Programming Languages</label>
                    <DropDown
                        name="targetAudience"
                        options={["Online", "Offline"]}
                        defaultValue="-Select a type-"
                        // value={
                        //     state.course.audience === "college-students"
                        //         ? "College Students"
                        //         : state.course.audience === "professionals"
                        //             ? "Professionals"
                        //             : "Select a target audience"
                        // }
                        // onChange={(e) => {
                        //     const technicalValue =
                        //         e.target.value === "College Students"
                        //             ? "college-students"
                        //             : "professionals";
                        //     actions.setCourseAudience(technicalValue);
                        // }}
                        required
                    />
                </div>

                {/* Languages */}
                <div>
                    <label className="block text-sm font-bold text-black mb-2">Languages</label>
                    <div className="flex flex-wrap gap-2">
                        {languages.map((language) => (
                            <button type='button' className="flex items-center gap-2 bg-[#F3F3F3] py-2 px-4 rounded-xl" key={language.value}>
                                <span className='font-plus-jakarta font-medium text-[#575757] text-base leading-[173%]'>{language.name}</span>
                                <Cross className='w-3 h-3 text-[#000000] cursor-pointer rotate-45' fill='#000000' />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Batch number */}
                <div>
                    <label className="block text-sm font-bold text-black mb-2">Batch number</label>
                    <DropDown
                        name="targetAudience"
                        options={["Online", "Offline"]}
                        defaultValue="-Select a type-"
                        // value={
                        //     state.course.audience === "college-students"
                        //         ? "College Students"
                        //         : state.course.audience === "professionals"
                        //             ? "Professionals"
                        //             : "Select a target audience"
                        // }
                        // onChange={(e) => {
                        //     const technicalValue =
                        //         e.target.value === "College Students"
                        //             ? "college-students"
                        //             : "professionals";
                        //     actions.setCourseAudience(technicalValue);
                        // }}
                        required
                    />
                </div>

                <div className='w-full flex justify-between mt-8'>
                    <div className='flex flex-col gap-1'>
                        <p className='text-sm font-plus-jakarta font-bold text-[#2B150899]'>Total price</p>
                        <p className='text-xl font-plus-jakarta font-bold text-[#000000]'>$100</p>
                    </div>
                    <OrangeButton className="text-base font-bold py-0 px-12 font-plus-jakarta" glow>
                        Enroll now!
                    </OrangeButton>
                </div>
            </div>
        </div>)
}

export default EnrollmentDetails