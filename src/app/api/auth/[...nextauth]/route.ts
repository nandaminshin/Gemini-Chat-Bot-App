import NextAuth from "next-auth"
import type { AuthOptions } from "next-auth"
import type { Adapter } from "next-auth/adapters"
import GoogleProvider from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/src/lib/mongodb"
import { ObjectId } from "mongodb";

// Only initialize the MongoDB adapter when the connection URI is present.
// Initializing the adapter at import-time can cause build-time failures if the
// environment isn't fully available (for example during Vercel build). Make
// adapter optional so the app can build; at runtime the adapter will be used
// when MONGODB_URI is configured.
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
            // The user object already contains all the data from the database.
            // Simply assign the properties to the session.
            session.user.id = user.id;
            session.user.apiKey = user.apiKey; // Directly access the apiKey from the user object
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
