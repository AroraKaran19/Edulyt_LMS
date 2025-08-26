import { FlexBox } from '@/components/ui'
import React from 'react'
import { CreditCard, AlertTriangle, Mail, MapPin, Phone, XCircle, CheckCircle, Clock, FileText } from 'lucide-react'

const CancellationRefundPolicy = () => {
  return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
			{/* Hero Section */}
			<div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-16">
				<div className="container mx-auto px-6">
					<FlexBox direction="col" className="items-center text-center">
						<h1 className="text-4xl md:text-5xl font-bold font-coolvetica mb-4">
							Cancellation & Refund Policy
						</h1>
						<p className="text-xl text-orange-100 max-w-2xl">
							Understanding our cancellation and refund terms for digital products and services.
						</p>
						<div className="mt-6 text-sm text-orange-200">
							Last updated: {new Date().toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</div>
					</FlexBox>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-6 py-12">
				<div className="max-w-4xl mx-auto">

					{/* Overview Section */}
					<section className="mb-12">
						<FlexBox direction="col" className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
							<h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
								Overview
							</h2>
							<p className="text-gray-700 leading-relaxed text-lg">
								Thank you for choosing Edulyt, operated by Airkrit India Pvt. Ltd. We strive to provide the best possible
								experience for our users. This Cancellation & Refund Policy outlines the terms under which cancellations
								are accepted and clarifies our stance on refunds for our digital products and services.
							</p>
						</FlexBox>
					</section>

					{/* Digital Products and Services Section */}
					<section className="mb-12">
						<FlexBox direction="col" className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
							<FlexBox className="items-center gap-3 mb-6">
								<div className="bg-blue-100 p-2 rounded-full">
									<CreditCard className="w-6 h-6 text-blue-600" />
								</div>
								<h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
									Digital Products and Services
								</h2>
							</FlexBox>
							<div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
								<p className="text-gray-700 leading-relaxed text-lg">
									All products and services provided by Edulyt are digital. Due to the nature of digital content,
									once access has been granted or content has been downloaded, we are unable to offer refunds.
									We encourage you to review the product details and ensure it meets your needs before making a purchase.
								</p>
							</div>
						</FlexBox>
					</section>

					{/* Cancellation Policy Section */}
					<section className="mb-12">
						<FlexBox direction="col" className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
							<h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
								Cancellation Policy
							</h2>

							{/* Subscription Services */}
							<div className="mb-8">
								<FlexBox className="items-center gap-3 mb-4">
									<div className="bg-green-100 p-2 rounded-full">
										<Clock className="w-6 h-6 text-green-600" />
									</div>
									<h3 className="text-2xl font-semibold text-gray-800">Subscription Services</h3>
								</FlexBox>
								<p className="text-gray-700 mb-4">
									If you have subscribed to a service, you may cancel your subscription at any time. However, please note the following:
								</p>
								<div className="space-y-4">
									<div className="bg-red-50 p-4 rounded-xl border border-red-200">
										<FlexBox className="items-center gap-3 mb-2">
											<XCircle className="w-5 h-5 text-red-600" />
											<h4 className="font-semibold text-red-800">No Refunds:</h4>
										</FlexBox>
										<p className="text-gray-700">
											Cancellation of a subscription does not entitle you to a refund for any portion of the subscription fee.
											You will continue to have access to the service until the end of your current billing period.
										</p>
									</div>
									<div className="bg-green-50 p-4 rounded-xl border border-green-200">
										<FlexBox className="items-center gap-3 mb-2">
											<CheckCircle className="w-5 h-5 text-green-600" />
											<h4 className="font-semibold text-green-800">Future Billing:</h4>
										</FlexBox>
										<p className="text-gray-700">
											Cancelling a subscription will stop future billing. You will not be charged for subsequent billing cycles.
										</p>
									</div>
								</div>
							</div>

							{/* One-Time Purchases */}
							<div>
								<FlexBox className="items-center gap-3 mb-4">
									<div className="bg-orange-100 p-2 rounded-full">
										<FileText className="w-6 h-6 text-orange-600" />
									</div>
									<h3 className="text-2xl font-semibold text-gray-800">One-Time Purchases</h3>
								</FlexBox>
								<p className="text-gray-700 leading-relaxed">
									For one-time purchases of digital content, cancellations are not possible once the transaction has been completed.
								</p>
							</div>
						</FlexBox>
					</section>

					{/* Exceptions Section */}
					<section className="mb-12">
						<FlexBox direction="col" className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
							<FlexBox className="items-center gap-3 mb-6">
								<div className="bg-purple-100 p-2 rounded-full">
									<AlertTriangle className="w-6 h-6 text-purple-600" />
								</div>
								<h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
									Exceptions
								</h2>
							</FlexBox>
							<p className="text-gray-700 mb-6 leading-relaxed">
								While our general policy is to not provide refunds, we understand that exceptional circumstances may arise.
								Refund requests will be considered on a case-by-case basis and at the sole discretion of Edulyt.
								Situations that may warrant consideration include:
							</p>
							<div className="space-y-4">
								<div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
									<h4 className="font-semibold text-blue-800 mb-2">Technical issues:</h4>
									<p className="text-gray-700">
										If you experience technical difficulties that prevent you from accessing the content or service,
										and our support team is unable to resolve the issue.
									</p>
								</div>
								<div className="bg-green-50 p-6 rounded-xl border border-green-200">
									<h4 className="font-semibold text-green-800 mb-2">Accidental purchase:</h4>
									<p className="text-gray-700">
										If you accidentally purchase the wrong product and notify us immediately before accessing any content.
									</p>
								</div>
							</div>
						</FlexBox>
					</section>

					{/* How to Request Section */}
					<section className="mb-12">
						<FlexBox direction="col" className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
							<h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
								How to Request a Cancellation or Refund
							</h2>
							<p className="text-gray-700 mb-6 leading-relaxed">
								To request a cancellation or refund, please contact our customer support team at{' '}
								<a href="mailto:info@edulyt.com" className="text-orange-600 font-semibold hover:underline">
									info@edulyt.com
								</a>{' '}
								with the following information:
							</p>
							<div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
								<ul className="list-disc list-inside space-y-2 text-gray-700">
									<li>Your full name</li>
									<li>Email address used for the purchase</li>
									<li>Order number</li>
									<li>Reason for the request</li>
								</ul>
								<p className="text-gray-700 mt-4 font-semibold">
									Our team will review your request and respond within 5-7 business days.
								</p>
							</div>
						</FlexBox>
					</section>

					{/* Changes to Policy Section */}
					<section className="mb-12">
						<FlexBox direction="col" className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
							<FlexBox className="items-center gap-3 mb-6">
								<div className="bg-indigo-100 p-2 rounded-full">
									<FileText className="w-6 h-6 text-indigo-600" />
								</div>
								<h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
									Changes to This Policy
								</h2>
							</FlexBox>
							<p className="text-gray-700 leading-relaxed text-lg">
								We may update our Cancellation & Refund Policy from time to time. Any changes will be posted on this page,
								and we will update the &quot;Last updated&quot; date at the top of the policy. We encourage you to review this policy
								periodically to stay informed about our terms and conditions.
							</p>
						</FlexBox>
					</section>

					{/* Contact Section */}
					<section className="mb-12">
						<FlexBox direction="col" className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-2xl p-8 shadow-lg">
							<h2 className="text-3xl font-bold mb-6 font-coolvetica text-center">
								Contact Us
							</h2>
							<p className="text-orange-100 text-center mb-8">
								If you have any questions about our Cancellation & Refund Policy, please contact us at:
							</p>
							<div className="grid md:grid-cols-3 gap-6">
								<FlexBox direction="col" className="items-center text-center">
									<div className="bg-white/20 p-3 rounded-full mb-3">
										<Mail className="w-6 h-6" />
									</div>
									<h3 className="font-semibold mb-2">Email</h3>
									<a href="mailto:info@edulyt.com" className="text-orange-100 hover:text-white transition-colors">
										info@edulyt.com
									</a>
								</FlexBox>
								<FlexBox direction="col" className="items-center text-center">
									<div className="bg-white/20 p-3 rounded-full mb-3">
										<MapPin className="w-6 h-6" />
									</div>
									<h3 className="font-semibold mb-2">Address</h3>
									<p className="text-orange-100">
										Dwarka, New Delhi- 110077
									</p>
								</FlexBox>
								<FlexBox direction="col" className="items-center text-center">
									<div className="bg-white/20 p-3 rounded-full mb-3">
										<Phone className="w-6 h-6" />
									</div>
									<h3 className="font-semibold mb-2">Phone</h3>
									<a href="tel:+918929252575" className="text-orange-100 hover:text-white transition-colors">
										+91-8929252575
									</a>
								</FlexBox>
							</div>
						</FlexBox>
					</section>

					{/* Footer Message */}
					<section>
						<FlexBox direction="col" className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100 text-center">
							<div className="bg-orange-100 p-6 rounded-xl">
								<h3 className="text-2xl font-bold text-orange-800 mb-4 font-coolvetica">
									Thank You for Understanding
								</h3>
								<p className="text-orange-700 text-lg">
									We value your business and strive to ensure a satisfactory experience with Edulyt.
								</p>
							</div>
						</FlexBox>
					</section>

				</div>
			</div>
		</div>
  )
}

export default CancellationRefundPolicy