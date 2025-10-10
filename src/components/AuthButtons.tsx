'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';

export default function AuthButtons() {
    const { data: session } = useSession();

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <p className="text-sky-600">Signed in as {session.user?.email}</p>
                {session.user?.image && (
                    <Image
                        src={session.user.image}
                        alt="User profile picture"
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                )}
                <button
                    onClick={() => signOut()}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Sign out
                </button>
            </div>
        );
    }
    return (
        <button
            onClick={() => signIn('google')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
            Sign in with Google
        </button>
    );
}

