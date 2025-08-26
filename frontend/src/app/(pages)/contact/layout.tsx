import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Contact Us | Edulyt',
    description: 'Contact Us | Edulyt',
    keywords: ['Contact Us', 'Edulyt'],
    robots: 'index, follow',
    icons: {
        icon: '/favicon.ico',
    },
}

const layout = ({ children }: { children: React.ReactNode }) => {
    return children;
}

export default layout