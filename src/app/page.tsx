import AuthButtons from "@/src/components/AuthButtons";

export default function Home() {
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
