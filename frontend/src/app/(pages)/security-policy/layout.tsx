import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Security Policy | Edulyt',
    description: 'Security Policy | Edulyt',
    keywords: ['Security Policy', 'Edulyt'],
    robots: 'index, follow',
    icons: {
        icon: '/favicon.ico',
    },
}

const layout = ({ children }: { children: React.ReactNode }) => {
    return children;
}

export default layout