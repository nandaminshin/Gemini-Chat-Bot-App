"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Account from "./Account";
import { MoreVertical, Share2, Pencil, Trash2, KeyRound } from 'lucide-react';

type Message = {
    id: string;
    sender: "user" | "bot";
    text: string;
    timestamp?: string;
}

export default function ChatUI() {
    const { data: session, update } = useSession({ required: true });
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", sender: "bot", text: "Welcome! Ask me anything.", timestamp: new Date().toLocaleTimeString() },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [accountOpen, setAccountOpen] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
    const [openConversationMenu, setOpenConversationMenu] = useState<string | null>(null);
    const [userApiKey, setUserApiKey] = useState('');


    async function sendMessage() {
        if (!input.trim()) return;
        const newMsg: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: input.trim(),
            timestamp: new Date().toLocaleTimeString(),
        };

        // Optimistic UI
        setMessages((m) => [...m, newMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const resp = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: currentConversationId, message: newMsg }),
            });
            const data = await resp.json();
            if (data?.botMessage) {
                setMessages((m) => [...m, data.botMessage]);
            }
            if (data?.conversationId) setCurrentConversationId(data.conversationId);
        } catch (err) {
            console.error('sendMessage error', err);
            setMessages((m) => [...m, { id: Date.now().toString() + '-bot', sender: 'bot', text: 'Failed to send message.', timestamp: new Date().toLocaleTimeString() }]);
        } finally {
            setIsTyping(false);
            // refresh conversation list
            fetchConversations();
        }
    }

    // scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // fetch conversation list
    async function fetchConversations() {
        try {
            const res = await fetch('/api/chat');
            const j = await res.json();
            setConversations(j.items || []);
        } catch (err) {
            console.error('fetchConversations', err);
        }
    }

    useEffect(() => {
        if (session?.user) {
            fetchConversations();
        }
    }, [session]);

    async function loadConversation(id: string) {
        try {
            const res = await fetch(`/api/chat/${id}`);
            const j = await res.json();
            setMessages(j.messages || []);
            setCurrentConversationId(id);
            setOpenConversationMenu(null); // Close menu when loading a conversation
        } catch (err) {
            console.error('loadConversation', err);
        }
    }

    async function finishConversationAndNew() {
        try {
            if (currentConversationId) {
                await fetch('/api/chat/finish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: currentConversationId }) });
            }
        } catch (err) {
            console.error('finish', err);
        } finally {
            // refresh list and reset UI
            await fetchConversations();
            setCurrentConversationId(undefined);
            setMessages([{ id: Date.now().toString(), sender: 'bot', text: 'Welcome! Ask me anything.', timestamp: new Date().toLocaleTimeString() }]);
        }
    }

    async function deleteConversation(id: string) {
        try {
            const res = await fetch(`/api/chat/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                // Remove the conversation from the list
                setConversations(conversations.filter(c => c.id !== id));
                // If the deleted conversation was the current one, start a new chat
                if (currentConversationId === id) {
                    finishConversationAndNew();
                }
            } else {
                console.error('Failed to delete conversation');
            }
        } catch (err) {
            console.error('deleteConversation error', err);
        } finally {
            setOpenConversationMenu(null);
        }
    }

    const handleShare = (id: string) => {
        console.log("Share:", id);
        setOpenConversationMenu(null);
    };

    const handleRename = (id: string) => {
        console.log("Rename:", id);
        setOpenConversationMenu(null);
    };

    const handleApiKeySave = async () => {
        try {
            await fetch('/api/user/apikey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: userApiKey }),
            });
            // Update the session to include the new API key
            await update();
        } catch (error) {
            console.error('Failed to save API key:', error);
        }
    };

    // If the user has not provided an API key, show the input form
    if (!(session as any)?.user.apiKey) {
        return (
            <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center text-gray-100 p-6">
                <div className="w-full max-w-md bg-gray-900/80 p-8 rounded-2xl border border-gray-800 text-center">
                    <KeyRound size={48} className="mx-auto text-sky-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Enter Your Gemini API Key</h2>

                    <p className="text-gray-400 mb-6">
                        You can get a free API key from{' '}
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">
                            Google AI Studio
                        </a>.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={userApiKey}
                            onChange={(e) => setUserApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="flex-1 bg-gray-800/50 rounded-md px-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                            onClick={handleApiKeySave}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-[#0b0f14] flex gap-6 text-gray-100 p-6 relative">
            {/* Sidebar */}
            {sidebarOpen && (
                <aside className="w-80 bg-gradient-to-b from-gray-900/90 to-gray-900/70 border border-gray-800 rounded-xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold">Gemini Chat</h2>
                            <div className="text-xs text-gray-400">Conversations</div>
                        </div>
                        <button onClick={finishConversationAndNew} className="flex items-center gap-2 px-3 py-1 bg-gray-800/60 hover:bg-gray-800 rounded-md text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New
                        </button>
                    </div>

                    <div className="mb-3">
                        <input placeholder="Search conversations" className="w-full bg-gray-800/50 rounded-md px-3 py-2 text-sm placeholder-gray-400 focus:outline-none" />
                    </div>

                    <div className="flex-1 overflow-auto space-y-2 pt-2">
                        {conversations.map((c) => (
                            <div key={c.id} className="relative">
                                <div onClick={() => loadConversation(c.id)} className="p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800/60 cursor-pointer flex justify-between items-center">
                                    <div>
                                        <div className="text-sm truncate w-48">{c.summary || (c.lastMessage?.text ? c.lastMessage.text.slice(0, 48) : 'Untitled')}</div>
                                        <div className="text-xs text-gray-500 mt-1">{new Date(c.updatedAt).toLocaleString()}</div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent loading conversation
                                            setOpenConversationMenu(openConversationMenu === c.id ? null : c.id);
                                        }}
                                        className="p-1 text-gray-400 hover:text-white"
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                                {openConversationMenu === c.id && (
                                    <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10">
                                        <button onClick={(e) => { e.stopPropagation(); handleShare(c.id); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2">
                                            <Share2 size={16} /> Share
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleRename(c.id); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2">
                                            <Pencil size={16} /> Rename
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-800 flex items-center gap-2">
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-gray-500">Signed in as <span className="text-gray-300">{session?.user?.name ?? session?.user?.email}</span></div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setAccountOpen(true)} className="text-sm px-2 py-1 bg-gray-800/60 hover:bg-gray-800 rounded-md">Account</button>
                            <button onClick={() => setSidebarOpen(false)} className="text-sm px-2 py-1 bg-gray-800/60 hover:bg-gray-800 rounded-md">Hide</button>
                        </div>
                    </div>
                </aside>
            )}

            {/* collapsed sidebar toggle */}
            {!sidebarOpen && (
                <div className="absolute left-4 top-8 z-40">
                    <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 bg-gray-900/80 rounded-full flex items-center justify-center border border-gray-800 hover:bg-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-200" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h2a1 1 0 100-2H4a3 3 0 00-3 3v2a1 1 0 102 0V5zM3 11a1 1 0 011-1h10a1 1 0 100-2H4a3 3 0 00-3 3v2a1 1 0 102 0v-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Main chat area */}
            <section className="flex-1 flex flex-col h-[78vh]">
                <header className="flex items-center justify-between p-3 rounded-md mb-4">
                    <div className="flex items-center gap-3">
                        {session?.user?.image ? (
                            <Image
                                src={session.user.image}
                                alt="Profile"
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-gray-700 rounded-full" />
                        )}
                        <div>
                            <div className="font-semibold text-white">{session?.user?.name ?? session?.user?.email}</div>
                            <div className="text-xs text-gray-500">Chat with Gemini-style assistant</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-400">Model: Gemini (stub)</div>
                        <button title="New chat" onClick={finishConversationAndNew} className="w-8 h-8 bg-gray-800/40 rounded-md flex items-center justify-center hover:bg-gray-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div ref={scrollRef} className="flex-1 overflow-auto bg-gradient-to-b from-[#071018] to-[#071018]/80 p-5 rounded-2xl border border-gray-800">
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {messages.map((m) => (
                            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex items-end gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {m.sender === 'bot' ? (
                                            <Image src='/images/chat.png' alt="you" width={36} height={36} />
                                        ) : session?.user?.image ? (
                                            <Image src={session.user.image} alt="you" width={36} height={36} className="rounded-full" />
                                        ) : (
                                            <div className="w-9 h-9 bg-gray-700 rounded-full" />
                                        )}
                                    </div>

                                    <div className={`max-w-[70%] p-4 rounded-2xl ${m.sender === 'user' ? 'bg-sky-600 text-white rounded-br-md' : 'bg-gray-800/60 text-gray-100 rounded-bl-md'}`}>
                                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
                                        <div className="text-[11px] text-gray-400 mt-2 text-right">{m.timestamp}</div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full" />
                                <div className="bg-gray-800/60 text-gray-100 px-4 py-2 rounded-2xl">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="mt-4 flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-900/60 rounded-full px-3 py-2 flex-1 border border-gray-800">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") sendMessage();
                            }}
                            placeholder="Type a message or /command"
                            className="flex-1 bg-transparent outline-none text-sm text-gray-100 placeholder-gray-500"
                            aria-label="Message input"
                        />
                        <button onClick={sendMessage} className="bg-sky-600 hover:bg-sky-500 text-white p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </footer>
            </section>
            {/* Account modal */}
            {accountOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div onClick={() => setAccountOpen(false)} className="absolute inset-0 bg-black/60" />
                    <div className="relative w-full max-w-lg mx-4 bg-gray-900 rounded-2xl border border-gray-800 p-6 z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Account Settings</h3>
                            <button onClick={() => setAccountOpen(false)} className="text-gray-400 hover:text-gray-200">✕</button>
                        </div>
                        <div className="text-sm text-gray-100">
                            <Account />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
