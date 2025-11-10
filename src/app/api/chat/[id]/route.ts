import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session: any = await getServerSession(authOptions as any);
    if (!session || !session.user?.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const userId = session.user.id;

    try {
        const id = params.id;
        if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

        const client = await clientPromise;
        const db = client.db();
        const col = db.collection('conversations');

        const conv = await col.findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
        if (!conv) return new Response(JSON.stringify({ error: 'Conversation not found or access denied' }), { status: 404 });

        return new Response(JSON.stringify(conv), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const session: any = await getServerSession(authOptions as any);
    if (!session || !session.user?.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const userId = session.user.id;

    try {
        const id = params.id;
        if (!id) {
            return new Response(JSON.stringify({ error: 'Conversation ID is required' }), { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection('conversations');

        const result = await collection.deleteOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });

        if (result.deletedCount === 0) {
            return new Response(JSON.stringify({ error: 'Conversation not found or access denied' }), { status: 404 });
        }

        return new Response(JSON.stringify({ message: 'Conversation deleted successfully' }), { status: 200 });
    } catch (error) {
        console.error('Failed to delete conversation:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
