import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
    // Don't throw during build-time imports — warn and provide a rejected promise instead.
    // This prevents Next's build from failing when environment variables aren't available
    // during static analysis. Runtime code that needs the DB will still fail when
    // awaiting the exported promise, which is desirable.
    console.warn('Warning: MONGODB_URI is not set. MongoDB operations will fail at runtime.');
}

const uri = process.env.MONGODB_URI || ''
let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!uri) {
    // Export a rejected promise so runtime code that needs the DB fails when awaited,
    // but avoids throwing during module import / build-time.
    clientPromise = Promise.reject(new Error('Invalid/Missing environment variable: "MONGODB_URI"'))
} else if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri)
        globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri)
    clientPromise = client.connect()
}

export default clientPromise

