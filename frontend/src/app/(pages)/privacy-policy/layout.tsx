import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Privacy Policy | Airkrit',
    description: 'Privacy Policy | Airkrit',
    keywords: ['Privacy Policy', 'Airkrit'],
    robots: 'index, follow',
    icons: {
        icon: '/favicon.ico',
    },
}

const layout = ({ children }: { children: React.ReactNode }) => {
    return children;
}

export default layout