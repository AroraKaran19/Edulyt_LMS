import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Frequently Asked Questions - Airkrit',
	description: 'Find answers to common questions about Airkrit courses, enrollment, payments, and more. Get help with your learning journey.',
	keywords: 'FAQ, frequently asked questions, Airkrit help, course enrollment, payment methods, refund policy, technical support',
	openGraph: {
		title: 'Frequently Asked Questions - Airkrit',
		description: 'Find answers to common questions about Airkrit courses, enrollment, payments, and more.',
		type: 'website',
		url: 'https://airkrit.com/faq',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Frequently Asked Questions - Airkrit',
		description: 'Find answers to common questions about Airkrit courses, enrollment, payments, and more.',
	},
}

export default function FAQLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="faq-layout">
			{children}
		</div>
	)
}
