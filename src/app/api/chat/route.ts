import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
    const session: any = await getServerSession(authOptions as any);
    if (!session || !session.user?.id) {
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
    }
    const userId = session.user.id;

    try {
        const client = await clientPromise;
        const db = client.db();
        const col = db.collection('conversations');

        const items = await col.find({ userId: new ObjectId(userId) }).sort({ updatedAt: -1 }).limit(50).toArray();

        const mapped = items.map((it: any) => ({ id: it._id.toString(), summary: it.summary, updatedAt: it.updatedAt, lastMessage: it.messages?.[it.messages.length - 1] }));

        return new Response(JSON.stringify({ items: mapped }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
}
