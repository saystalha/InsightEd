import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import User from '@/models/User';

/**
 * Shared admin authentication helper.
 *
 * Reads the `insighted_session` cookie, looks up the user in the database,
 * and verifies they have the `admin` role.
 *
 * @returns {{ authorized: true, currentUser: object }
 *          | { authorized: false, error: string, status: number }}
 *
 * Usage in any admin route:
 *   const auth = await checkAdminAuth();
 *   if (!auth.authorized) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   }
 */
export async function checkAdminAuth() {
  // Read the HttpOnly session cookie set at login
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('insighted_session');

  // Reject if no session cookie is present
  if (!sessionCookie || !sessionCookie.value) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  // Ensure DB is connected before querying
  await connectDB();

  // Look up the user by the session value (stored MongoDB _id)
  const currentUser = await User.findById(sessionCookie.value);

  // Reject if user no longer exists or is not an admin
  if (!currentUser || currentUser.role !== 'admin') {
    return { authorized: false, error: 'Forbidden — admin access required', status: 403 };
  }

  return { authorized: true, currentUser };
}
