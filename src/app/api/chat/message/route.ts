import clientPromise from '@/src/lib/mongodb';
import { callGemini } from '@/src/lib/gemini';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    type user = {
        id: string;
        name: string;
        email: string;
        image: string;
        apiKey: string;
    };
    const session: any = await getServerSession(authOptions as any);
    if (!session || !session.user?.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const { conversationId, message } = body;

        const client = await clientPromise;
        const db = client.db();
        const usersCol = db.collection('users');
        const user = await usersCol.findOne({ _id: new ObjectId(userId) });

        if (!user || !user.apiKey) {
            return new Response(JSON.stringify({
                botMessage: {
                    id: Date.now().toString() + '-bot',
                    sender: 'bot',
                    text: 'API key not found. Please add your API key in the Account settings.',
                    timestamp: new Date().toLocaleTimeString()
                }
            }), { status: 200 });
        }

        let convId = conversationId;
        const convCol = db.collection('conversations');

        if (!convId) {
            const now = new Date();
            const insert = await convCol.insertOne({
                userId: new ObjectId(userId), // Associate with user
                messages: [message],
                summary: null,
                createdAt: now,
                updatedAt: now,
                finished: false
            });
            convId = insert.insertedId.toString();
        } else {
            // Ensure the user owns this conversation before adding a message
            const existingConv = await convCol.findOne({ _id: new ObjectId(convId), userId: new ObjectId(userId) });
            if (!existingConv) {
                return new Response(JSON.stringify({ error: 'Conversation not found or access denied' }), { status: 404 });
            }
            await (convCol as any).updateOne({ _id: new ObjectId(convId) }, { $push: { messages: message }, $set: { updatedAt: new Date() } });
        }

        // Build a prompt for the model using the last user message + short history context
        const prompt = `Respond as a helpful assistant. User said: ${message.text}`;

        let botText = '';
        try {
            botText = await callGemini(prompt, user.apiKey);
        } catch (err) {
            // Log full error on server for debugging, but return a user-friendly message to the client
            console.error('callGemini error:', err);
            botText = `Model currently unavailable. Please try again later.`;
        }

        const botMessage = { id: Date.now().toString() + '-bot', sender: 'bot', text: botText, timestamp: new Date().toLocaleTimeString() };

        await (convCol as any).updateOne({ _id: new ObjectId(convId) }, { $push: { messages: botMessage }, $set: { updatedAt: new Date() } });

        return new Response(JSON.stringify({ conversationId: convId, botMessage }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
}
