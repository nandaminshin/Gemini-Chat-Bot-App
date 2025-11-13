import type { AuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/src/lib/mongodb";

const maybeAdapter = process.env.MONGODB_URI ? (MongoDBAdapter(clientPromise) as unknown as Adapter) : undefined;

export const authOptions: AuthOptions = {
    adapter: maybeAdapter,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    callbacks: {
        async session({ session, user }: { session: any; user: any }) {
            session.user.id = user.id;
            session.user.apiKey = user.apiKey;
            return session;
        },
    },
};
