import AuthButtons from "@/src/components/AuthButtons";
import { getServerSession } from "next-auth";
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import ChatUI from "@/src/components/ChatUI";

export default async function Home() {

    const session = await getServerSession(authOptions as any)
    if (session) {
        return (
            <main className="min-h-screen p-6 bg-black-950">
                <ChatUI />
            </main>
        );
    }
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="flex flex-col items-center gap-6">
                <h1 className="text-4xl font-bold">Welcome to your AI Chat App</h1>
                <p className="text-lg text-gray-600">Sign in to get started!</p>
                <AuthButtons />
            </div>
        </main>
    );
}
