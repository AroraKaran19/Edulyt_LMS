import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Cancellation & Refund Policy | Airkrit',
    description: 'Cancellation & Refund Policy | Airkrit',
    keywords: ['Cancellation & Refund Policy', 'Airkrit'],
    robots: 'index, follow',
    icons: {
        icon: '/favicon.ico',
    },
}

const layout = ({ children }: { children: React.ReactNode }) => {
    return children;
}

export default layout