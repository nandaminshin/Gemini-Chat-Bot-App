import type { AuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/src/lib/mongodb";

if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

export const authOptions: AuthOptions = {
    adapter: MongoDBAdapter(clientPromise) as Adapter,
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
