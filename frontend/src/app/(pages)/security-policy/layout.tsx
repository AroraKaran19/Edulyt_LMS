import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Security Policy | Airkrit',
    description: 'Security Policy | Airkrit',
    keywords: ['Security Policy', 'Airkrit'],
    robots: 'index, follow',
    icons: {
        icon: '/favicon.ico',
    },
}

const layout = ({ children }: { children: React.ReactNode }) => {
    return children;
}

export default layout