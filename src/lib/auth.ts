import type { AuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/src/lib/mongodb";

// Don't throw during build-time imports. The MongoDB client module already
// avoids throwing during import; mirror that behavior here so importing
// `authOptions` (for example when Next collects route metadata) doesn't
// break the build when environment variables aren't available.
if (!process.env.MONGODB_URI) {
    console.warn('Warning: MONGODB_URI is not set. MongoDB adapter will be disabled.');
}

const adapter: Adapter | undefined = process.env.MONGODB_URI
    ? (MongoDBAdapter(clientPromise) as Adapter)
    : undefined;

export const authOptions: AuthOptions = {
    // adapter is optional; if MONGODB_URI is missing we keep it undefined so
    // route imports don't throw during static analysis/build.
    adapter,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    callbacks: {
        async session({ session, user }: { session: any; user: any }) {
            // Be defensive: ensure session.user exists before assigning properties.
            if (session?.user) {
                session.user.id = user?.id;
                session.user.apiKey = user?.apiKey;
            }
            return session;
        },
    },
};
