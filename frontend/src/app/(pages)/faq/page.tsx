import { FlexBox } from '@/components/ui'
import React, { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, CreditCard, Users, Shield, Globe, Award, Mail, Phone } from 'lucide-react'

interface FAQItem {
	question: string
	answer: string
}

interface FAQCategory {
	title: string
	icon: React.ReactNode
	items: FAQItem[]
}

const FAQPage = () => {
	const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({})

	const toggleItem = (categoryIndex: number, itemIndex: number) => {
		const key = `${categoryIndex}-${itemIndex}`
		setOpenItems(prev => ({
			...prev,
			[key]: !prev[key]
		}))
	}

	const faqCategories: FAQCategory[] = [
		{
			title: 'Course Enrollment & Access',
			icon: <BookOpen className="w-6 h-6" />,
			items: [
				{
					question: 'How do I enroll in a course?',
					answer: 'You can enroll in any course by visiting our course catalog, selecting your desired course, and following the enrollment process. Simply click on the course you want to take, review the details, and proceed with payment. Once payment is confirmed, you\'ll receive immediate access to the course content.'
				},
				{
					question: 'How long do I have access to my courses?',
					answer: 'Most courses provide lifetime access, meaning you can revisit the content anytime. However, some specialized courses may have specific time limits. Check individual course details for specific access duration information.'
				},
				{
					question: 'Can I access courses on mobile devices?',
					answer: 'Yes! Our platform is fully responsive and works on all devices including smartphones, tablets, and computers. You can learn on the go with our mobile-friendly interface.'
				},
				{
					question: 'What if I have technical issues accessing a course?',
					answer: 'If you experience technical difficulties, please contact our support team at info@edulyt.com or call us at +91-8929252575. We\'ll help you resolve any access issues promptly.'
				}
			]
		},
		{
			title: 'Payment & Billing',
			icon: <CreditCard className="w-6 h-6" />,
			items: [
				{
					question: 'What payment methods do you accept?',
					answer: 'We accept various payment methods including credit/debit cards, net banking, UPI, and digital wallets like Paytm, Google Pay, and PhonePe. All payments are processed securely through our trusted payment gateways.'
				},
				{
					question: 'Is my payment information secure?',
					answer: 'Absolutely! We use industry-standard encryption and security measures to protect your payment information. We never store your complete payment details on our servers.'
				},
				{
					question: 'Do you offer installment payment options?',
					answer: 'Currently, we offer full payment upfront for all courses. We\'re working on introducing installment options in the future to make learning more accessible.'
				},
				{
					question: 'Will I receive a receipt for my purchase?',
					answer: 'Yes, you\'ll receive an email receipt immediately after your payment is processed. You can also access your purchase history in your account dashboard.'
				}
			]
		},
		{
			title: 'Refunds & Cancellations',
			icon: <Shield className="w-6 h-6" />,
			items: [
				{
					question: 'Can I get a refund if I\'m not satisfied?',
					answer: 'Please refer to our Cancellation & Refund Policy for detailed information. Generally, due to the digital nature of our products, refunds are considered on a case-by-case basis for technical issues or accidental purchases.'
				},
				{
					question: 'How do I request a refund?',
					answer: 'To request a refund, contact our support team at info@edulyt.com with your order details and reason for the request. We\'ll review your case and respond within 5-7 business days.'
				},
				{
					question: 'Can I cancel my subscription?',
					answer: 'Yes, you can cancel your subscription at any time through your account settings. Cancellation will stop future billing, but you\'ll retain access until the end of your current billing period.'
				}
			]
		},
		{
			title: 'Course Content & Learning',
			icon: <Users className="w-6 h-6" />,
			items: [
				{
					question: 'What type of courses do you offer?',
					answer: 'We offer a wide range of courses across various domains including technology, business, design, marketing, and personal development. Our courses are designed by industry experts and professionals.'
				},
				{
					question: 'Do I get a certificate upon completion?',
					answer: 'Yes! Most of our courses provide certificates upon completion. These certificates are recognized and can be shared on your professional profiles like LinkedIn.'
				},
				{
					question: 'Can I download course materials?',
					answer: 'Course materials availability varies by course. Some courses allow downloading of supplementary materials, while video content is typically streamed online for the best learning experience.'
				},
				{
					question: 'Is there a community or forum for students?',
					answer: 'We\'re building a community platform where students can connect, share experiences, and help each other. This feature will be available soon!'
				}
			]
		},
		{
			title: 'Technical Support',
			icon: <Globe className="w-6 h-6" />,
			items: [
				{
					question: 'What are your support hours?',
					answer: 'Our customer support is available Monday to Friday from 9:00 AM to 6:00 PM IST, and Saturdays from 10:00 AM to 4:00 PM IST. We\'re closed on Sundays.'
				},
				{
					question: 'How can I contact support?',
					answer: 'You can reach us via email at info@edulyt.com, phone at +91-8929252575, or through the contact form on our website. We typically respond to emails within 24 hours.'
				},
				{
					question: 'What browsers are supported?',
					answer: 'Our platform works best on Chrome, Firefox, Safari, and Edge browsers. We recommend using the latest version of any of these browsers for optimal performance.'
				},
				{
					question: 'What internet speed do I need?',
					answer: 'We recommend a minimum internet speed of 2 Mbps for smooth video streaming. Higher speeds (5+ Mbps) will provide the best experience, especially for HD content.'
				}
			]
		},
		{
			title: 'Account & Profile',
			icon: <Award className="w-6 h-6" />,
			items: [
				{
					question: 'How do I reset my password?',
					answer: 'You can reset your password by clicking the "Forgot Password" link on the login page. You\'ll receive an email with instructions to create a new password.'
				},
				{
					question: 'Can I change my email address?',
					answer: 'Yes, you can update your email address in your account settings. Please note that this will be the email used for all future communications.'
				},
				{
					question: 'How do I update my profile information?',
					answer: 'You can update your profile information anytime by going to your account dashboard and clicking on "Edit Profile" in the settings section.'
				},
				{
					question: 'Can I delete my account?',
					answer: 'Yes, you can request account deletion by contacting our support team. Please note that this action is irreversible and will remove all your course access and data.'
				}
			]
		}
	]

	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
			{/* Hero Section */}
			<div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-16">
				<div className="container mx-auto px-6">
					<FlexBox direction="col" className="items-center text-center">
						<h1 className="text-4xl md:text-5xl font-bold font-coolvetica mb-4">
							Frequently Asked Questions
						</h1>
						<p className="text-xl text-orange-100 max-w-2xl">
							Find answers to common questions about Edulyt courses, enrollment, payments, and more.
						</p>
					</FlexBox>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-6 py-12">
				<div className="max-w-4xl mx-auto">

					{/* Search Section */}
					<section className="mb-12">
						<FlexBox direction="col" className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
							<FlexBox className="items-center gap-3 mb-6">
								<div className="bg-orange-100 p-2 rounded-full">
									<HelpCircle className="w-6 h-6 text-orange-600" />
								</div>
								<h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
									Find Your Answer
								</h2>
							</FlexBox>
							<p className="text-gray-700 mb-6 text-lg">
								Can&apos;t find what you&apos;re looking for? Browse through our categorized FAQ sections below or contact our support team for personalized assistance.
							</p>
							<div className="bg-orange-50 p-6 rounded-xl">
								<p className="text-orange-800 font-semibold">
									💡 Tip: Click on any question to expand and see the detailed answer.
								</p>
							</div>
						</FlexBox>
					</section>

					{/* FAQ Categories */}
					{faqCategories.map((category, categoryIndex) => (
						<section key={categoryIndex} className="mb-12">
							<FlexBox direction="col" className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
								<FlexBox className="items-center gap-3 mb-8">
									<div className="bg-orange-100 p-2 rounded-full">
										{category.icon}
									</div>
									<h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
										{category.title}
									</h2>
								</FlexBox>
								<div className="space-y-4">
									{category.items.map((item, itemIndex) => {
										const key = `${categoryIndex}-${itemIndex}`
										const isOpen = openItems[key]

										return (
											<div key={itemIndex} className="border border-gray-200 rounded-lg overflow-hidden">
												<button
													onClick={() => toggleItem(categoryIndex, itemIndex)}
													className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
												>
													<h3 className="text-lg font-semibold text-gray-800 pr-4">
														{item.question}
													</h3>
													{isOpen ? (
														<ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
													) : (
														<ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
													)}
												</button>
												{isOpen && (
													<div className="px-6 py-4 bg-white border-t border-gray-200">
														<p className="text-gray-700 leading-relaxed">
															{item.answer}
														</p>
													</div>
												)}
											</div>
										)
									})}
								</div>
							</FlexBox>
						</section>
					))}

					{/* Still Have Questions Section */}
					<section className="mb-12">
						<FlexBox direction="col" className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-2xl p-8 shadow-lg">
							<h2 className="text-3xl font-bold mb-6 font-coolvetica text-center">
								Still Have Questions?
							</h2>
							<p className="text-orange-100 text-center mb-8 text-lg">
								Can&apos;t find the answer you&apos;re looking for? Our support team is here to help!
							</p>
							<div className="grid md:grid-cols-2 gap-6">
								<FlexBox direction="col" className="items-center text-center">
									<div className="bg-white/20 p-3 rounded-full mb-3">
										<Mail className="w-6 h-6" />
									</div>
									<h3 className="font-semibold mb-2">Email Support</h3>
									<a href="mailto:info@edulyt.com" className="text-orange-100 hover:text-white transition-colors">
										info@edulyt.com
									</a>
								</FlexBox>
								<FlexBox direction="col" className="items-center text-center">
									<div className="bg-white/20 p-3 rounded-full mb-3">
										<Phone className="w-6 h-6" />
									</div>
									<h3 className="font-semibold mb-2">Phone Support</h3>
									<a href="tel:+918929252575" className="text-orange-100 hover:text-white transition-colors">
										+91-8929252575
									</a>
								</FlexBox>
							</div>
						</FlexBox>
					</section>

					{/* Quick Links Section */}
					<section>
						<FlexBox direction="col" className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
							<h2 className="text-3xl font-bold text-gray-900 mb-8 font-coolvetica text-center">
								Helpful Resources
							</h2>
							<div className="grid md:grid-cols-3 gap-6">
								<a href="/contact" className="block p-6 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-center">
									<h3 className="text-lg font-semibold text-orange-800 mb-2">Contact Us</h3>
									<p className="text-orange-700">Get in touch with our support team</p>
								</a>
								<a href="/privacy-policy" className="block p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center">
									<h3 className="text-lg font-semibold text-blue-800 mb-2">Privacy Policy</h3>
									<p className="text-blue-700">Learn about data protection</p>
								</a>
								<a href="/cancellation-refund-policy" className="block p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-center">
									<h3 className="text-lg font-semibold text-green-800 mb-2">Refund Policy</h3>
									<p className="text-green-700">Understand our refund terms</p>
								</a>
							</div>
						</FlexBox>
					</section>

				</div>
			</div>
		</div>
	)
}

export default FAQPage
