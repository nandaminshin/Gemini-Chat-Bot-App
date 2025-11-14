import { getServerSession } from 'next-auth';
import clientPromise from '@/src/lib/mongodb';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/src/lib/auth';

export async function GET(req: Request) {
    const session: any = await getServerSession(authOptions as any);
    if (!session || !session.user?.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ _id: new ObjectId(session.user.id) });
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        return new Response(JSON.stringify({ apiKey: user.apiKey || '' }), { status: 200 });

    } catch (error) {
        console.error('Failed to fetch API key:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}

export async function POST(req: Request) {
    const session: any = await getServerSession(authOptions as any);
    if (!session || !session.user?.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const { apiKey } = await req.json();
        if (!apiKey || typeof apiKey !== 'string') {
            return new Response(JSON.stringify({ error: 'API key is required' }), { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection('users');

        await usersCollection.updateOne(
            { _id: new ObjectId(session.user.id) },
            { $set: { apiKey: apiKey } }
        );

        return new Response(JSON.stringify({ message: 'API key saved successfully' }), { status: 200 });

    } catch (error) {
        console.error('Failed to save API key:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
