import { getServerSession } from 'next-auth'
import ChatUI from '@/src/components/ChatUI'
import React from 'react'

export default async function ChatPage() {
    const { authOptions } = await import('@/src/app/api/auth/[...nextauth]/route')
    const session: any = await getServerSession(authOptions as any)

    if (!session) {
        // If no session, redirect to home. In App Router we'd normally use redirect(),
        // but keeping it simple by rendering a message and a link back.
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Not signed in</h2>
                    <p>Please sign in first to access the chat.</p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen p-6 bg-black-950">
            <ChatUI />
        </main>
    )
}
