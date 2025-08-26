import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Privacy Policy | Edulyt',
    description: 'Privacy Policy | Edulyt',
    keywords: ['Privacy Policy', 'Edulyt'],
    robots: 'index, follow',
    icons: {
        icon: '/favicon.ico',
    },
}

const layout = ({ children }: { children: React.ReactNode }) => {
    return children;
}

export default layout