import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Cancellation & Refund Policy | Edulyt',
    description: 'Cancellation & Refund Policy | Edulyt',
    keywords: ['Cancellation & Refund Policy', 'Edulyt'],
    robots: 'index, follow',
    icons: {
        icon: '/favicon.ico',
    },
}

const layout = ({ children }: { children: React.ReactNode }) => {
    return children;
}

export default layout