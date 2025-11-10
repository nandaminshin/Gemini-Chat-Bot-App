'use client';

import { signOut } from 'next-auth/react';
import React from 'react';

const Account = () => {
    return (
        <div className="flex flex-col items-center gap-4">
            <p className="text-lg">Are you sure you want to sign out?</p>
            <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full"
            >
                Sign out
            </button>
        </div>
    );
};

export default Account;
