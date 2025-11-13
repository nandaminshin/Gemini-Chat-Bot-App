import clientPromise from '@/src/lib/mongodb';
import { callGemini } from '@/src/lib/gemini';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session: any = await getServerSession(authOptions as any);
    if (!session || !session.user?.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const userId = session.user.id;

    try {
        const { conversationId } = await req.json();
        if (!conversationId) return new Response(JSON.stringify({ error: 'conversationId required' }), { status: 400 });

        const client = await clientPromise;
        const db = client.db();
        const usersCol = db.collection('users');
        const user = await usersCol.findOne({ _id: new ObjectId(userId) });

        const convCol = db.collection('conversations');
        const conv = await convCol.findOne({ _id: new ObjectId(conversationId), userId: new ObjectId(userId) });
        if (!conv) return new Response(JSON.stringify({ error: 'Conversation not found or access denied' }), { status: 404 });

        let summary = 'Untitled conversation';
        // Only try to summarize if the user has an API key
        if (user && user.apiKey) {
            // Build a summary prompt
            const messagesArr = conv.messages || [];
            const joined = messagesArr.map((m: any) => `${m.sender}: ${m.text}`).join('\n');
            const prompt = `Give a short title (5 words or fewer) that summarizes the following conversation so it can be used as a conversation topic:\n\n${joined}`;

            try {
                const raw = await callGemini(prompt, user.apiKey);
                // Clean up summary
                summary = raw.split('\n')[0].trim();
                if (summary.length > 60) summary = summary.slice(0, 57) + '...';
            } catch (err) {
                console.error('Summary failed', err);
            }
        }

        await convCol.updateOne({ _id: new ObjectId(conversationId) }, { $set: { summary, finished: true, updatedAt: new Date() } });

        return new Response(JSON.stringify({ summary }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
}
