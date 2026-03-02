import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'CipherGrid — Real-Time Codenames',
    description: 'A real-time multiplayer social deduction game. Create a room, invite friends, and uncover your agents before the opposing team.',
    keywords: ['codenames', 'board game', 'multiplayer', 'social deduction', 'word game'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
                <div className="bg-grid min-h-screen">
                    {children}
                </div>
            </body>
        </html>
    )
}
