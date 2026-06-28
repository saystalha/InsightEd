import mongoose from 'mongoose';

/**
 * Cached Mongoose connection.
 *
 * Next.js (and serverless environments) re-imports modules on every request,
 * but the Node.js runtime persists the `global` object between requests in
 * the same process. We store the connection on `global` so that hot-reloads
 * and concurrent API routes all share a single MongoDB connection pool.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB using the MONGODB_URI environment variable.
 *
 * - Returns the cached connection if one already exists.
 * - Creates a new connection promise if none is in-flight.
 * - Resets the promise on failure so the next call can retry.
 *
 * @returns {Promise<mongoose.Mongoose>} The active Mongoose instance.
 * @throws {Error} If MONGODB_URI is not set or the connection fails.
 */
async function connectDB() {
  // Read the URI inside the function so it is always up-to-date
  // (important in environments where env vars are injected at runtime)
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not defined. Please add it to your .env.local file.'
    );
  }

  // Return the existing connection if it is healthy
  if (cached.conn) {
    return cached.conn;
  }

  // Start a new connection if no pending promise exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,         // Fail fast — don't queue operations if not connected
      serverSelectionTimeoutMS: 10000, // Give up selecting a server after 10 s
      socketTimeoutMS: 45000,         // Close idle sockets after 45 s
      connectTimeoutMS: 10000,        // TCP connect timeout
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Reset the promise so the next request can try connecting again
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
