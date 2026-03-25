// "use client";

// import { useState } from "react";
// import Image from "next/image";
// import { ChevronDown, ChevronUp } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { PrimaryButton } from "../ui/PrimaryButton";


// const FAQS = [
//     {
//         question: "The curriculum, designed by the faculty of Texas McCombs,",
//         answer: "Detailed information about the curriculum and its benefits will be shown here when expanded."
//     },
//     {
//         question: "The curriculum, designed by the faculty of Texas McCombs,",
//         answer: "Detailed information about the curriculum and its benefits will be shown here when expanded."
//     },
//     {
//         question: "The curriculum, designed by the faculty of Texas McCombs,",
//         answer: "Detailed information about the curriculum and its benefits will be shown here when expanded."
//     },
//     {
//         question: "The curriculum, designed by the faculty of Texas McCombs,",
//         answer: "Detailed information about the curriculum and its benefits will be shown here when expanded."
//     },
//     {
//         question: "The curriculum, designed by the faculty of Texas McCombs,",
//         answer: "Detailed information about the curriculum and its benefits will be shown here when expanded."
//     },
// ];

// export default function FAQ() {
//     const [openIndex, setOpenIndex] = useState<number | null>(null);

//     const toggleFAQ = (index: number) => {
//         setOpenIndex(openIndex === index ? null : index);
//     };

//     return (
//         <section className="bg-white pt-20 pb-10">
//             {/* FAQ Header */}
//             <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-12">
//                 <h2 className={cn("text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight", "text-[#F77124] mb-6")}>FAQ</h2>
//                 <p className={cn("text-sm sm:text-base md:text-lg leading-relaxed", "text-gray-800 font-medium max-w-prose mx-auto")}>
//                     Dive into Artificial Intelligence & Machine Learning projects to sharpen skills and build a unique portfolio
//                 </p>
//             </div>

//             {/* FAQ Accordion */}
//             <div className="max-w-6xl mx-auto px-1 sm:px-6 space-y-4 mb-20 sm:mb-32">
//                 {FAQS.map((faq, index) => (
//                     <div
//                         key={index}
//                         className="bg-[#F3F4F6] rounded-2xl overflow-hidden border border-transparent transition-all hover:border-orange-200"
//                     >
//                         <button
//                             onClick={() => toggleFAQ(index)}
//                             className="w-full px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between text-left group"
//                         >
//                             <span className={cn("text-gray-900 font-bold pr-4", "text-xs sm:text-sm font-medium")}>
//                                 {faq.question}
//                             </span>
//                             <div className="w-8 h-8 flex shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 group-hover:bg-orange-50 transition-colors">
//                                 {openIndex === index ? (
//                                     <ChevronUp className="w-5 h-5 text-gray-900" />
//                                 ) : (
//                                     <ChevronDown className="w-5 h-5 text-gray-900" />
//                                 )}
//                             </div>
//                         </button>

//                         <div
//                             className={cn(
//                                 "px-4 sm:px-8 overflow-hidden transition-all duration-300 ease-in-out",
//                                 openIndex === index ? "max-h-40 pb-6 opacity-100" : "max-h-0 opacity-0"
//                             )}
//                         >
//                             <p className={cn("text-gray-600 leading-relaxed max-w-prose", "text-xs sm:text-sm font-medium")}>
//                                 {faq.answer}
//                             </p>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             {/* Newsletter Section */}
//             <div className="max-w-[1400px] mx-auto px-4 sm:px-10">
//                 <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
//                     {/* Left: Banner / Image Placeholder */}
//                     <div className="flex-1 w-full relative">
//                         <div className="aspect-[16/9] lg:aspect-square w-full rounded-[30px] sm:rounded-[40px] bg-gray-50 flex items-center justify-center overflow-hidden relative shadow-2xl shadow-orange-100/50 group">
//                             <Image
//                                 src="/images/newsletter_banner.png"
//                                 alt="Newsletter Banner"
//                                 fill
//                                 className="object-cover  transition-transform duration-700 "
//                             />
//                             {/* Decorative subtle gradient overlay */}
//                             <div className="absolute inset-0 bg-gradient-to-br from-[#F77124]/5 to-transparent pointer-events-none" />
//                         </div>
//                     </div>

//                     {/* Right: Text & Form */}
//                     <div className="flex-1 w-full">
//                         <h3 className={cn("text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight", "text-[#2D241F] mb-8")}>
//                             Unlock your Potential with hands-on Experience through our Internship opportunities at <span className="text-[#F77124]">Edulyt.</span>
//                         </h3>

//                         <div className="space-y-4">
//                             <p className={cn("text-sm sm:text-base md:text-lg leading-relaxed", "font-bold text-gray-600")}>
//                                 Subscribe to our newsletter
//                             </p>
//                             <div className="flex flex-col sm:flex-row gap-4">
//                                 <input
//                                     type="text"
//                                     placeholder="Enter your name here"
//                                     className="flex-1 px-8 py-5 rounded-2xl bg-[#F9FAFB] border border-gray-200 focus:border-[#F77124] focus:ring-1 focus:ring-[#F77124] outline-none text-gray-800 placeholder:text-gray-400 font-medium shadow-inner"
//                                 />
//                                 <PrimaryButton variant="gradient" size="md">
//                                     Subscribe
//                                 </PrimaryButton>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </section>
//     );
// }
