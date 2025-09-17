import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
	title: 'Terms of Use | Airkrit',
	description: 'Terms of Use | Airkrit',
	keywords: ['Terms of Use', 'Airkrit'],
	robots: 'index, follow',
	icons: {
		icon: '/favicon.ico',
	},
}

const layout = ({ children }: { children: React.ReactNode }) => {
	return children;
}

export default layout