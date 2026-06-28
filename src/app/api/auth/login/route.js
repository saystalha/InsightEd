import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * On success, sets two cookies:
 *   - `insighted_session` (HttpOnly) — the user's MongoDB _id, used server-side
 *   - `insighted_user`              — JSON metadata (name, role), readable by client JS
 *
 * If the logged-in email matches the ADMIN_EMAIL environment variable and the
 * user's role is not already 'admin', they are auto-promoted to admin.
 * This is a one-time bootstrap mechanism for the first admin account.
 */
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Basic field presence validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Look up the user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return a generic message to avoid disclosing whether the email is registered
      return NextResponse.json(
        { error: 'Invalid email address or password' },
        { status: 401 }
      );
    }

    // Compare the submitted password against the stored bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email address or password' },
        { status: 401 }
      );
    }

    // Bootstrap: auto-promote to admin if this is the designated admin email
    // and the account was created before the role was set (e.g., via seed script).
    // This only runs once — after the first login the role is persisted in the DB.
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && email.toLowerCase() === adminEmail.toLowerCase() && user.role !== 'admin') {
      await User.updateOne({ _id: user._id }, { role: 'admin' });
      user.role = 'admin';
    }

    // Build the client-readable metadata object (does NOT contain password)
    const userMetadata = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    const cookieStore = await cookies();

    // Determine cookie duration (30 days if rememberMe is true, session-only if false)
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : undefined;

    // Client-readable cookie — used to personalise the UI without an extra API call
    cookieStore.set('insighted_user', JSON.stringify(userMetadata), {
      path: '/',
      maxAge: maxAge,
      sameSite: 'lax',
      // Not httpOnly — intentionally readable by client-side JS
    });

    // Determine whether to set Secure flag (true in production HTTPS, false in local dev HTTP)
    const url = new URL(request.url);
    const isSecure =
      url.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https';

    // HttpOnly session cookie — contains the user's DB _id; never readable by JS
    cookieStore.set('insighted_session', user._id.toString(), {
      httpOnly: true,
      secure: isSecure,
      path: '/',
      maxAge: maxAge,
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true, user: userMetadata });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
