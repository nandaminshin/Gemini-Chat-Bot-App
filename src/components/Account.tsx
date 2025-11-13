'use client';

import { signOut } from 'next-auth/react';
import React, { useEffect, useState } from 'react';

const Account = () => {
    const [apiKey, setApiKey] = useState('');
    const [newApiKey, setNewApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchApiKey = async () => {
            const res = await fetch('/api/user/apikey');
            if (res.ok) {
                const data = await res.json();
                setApiKey(data.apiKey);
                setNewApiKey(data.apiKey);
            }
        };
        fetchApiKey();
    }, []);

    const handleUpdateApiKey = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/user/apikey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: newApiKey }),
            });
            if (res.ok) {
                setSuccess('API key updated successfully');
                setApiKey(newApiKey);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to update API key');
            }
        } catch (error) {
            setError('An error occurred');
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="w-full">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                    Your API Key
                </label>
                <input
                    type="text"
                    id="apiKey"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <button
                onClick={handleUpdateApiKey}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
            >
                {loading ? 'Updating...' : 'Update API Key'}
            </button>
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
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
