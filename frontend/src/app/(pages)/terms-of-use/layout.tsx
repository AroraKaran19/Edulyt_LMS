import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
	title: 'Terms of Use | Edulyt',
	description: 'Terms of Use | Edulyt',
	keywords: ['Terms of Use', 'Edulyt'],
	robots: 'index, follow',
	icons: {
		icon: '/favicon.ico',
	},
}

const layout = ({ children }: { children: React.ReactNode }) => {
	return children;
}

export default layout