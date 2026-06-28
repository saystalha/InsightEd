import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/google
 *
 * Verifies a Google ID token submitted by the client after a Google Sign-In
 * button interaction. Uses Google's tokeninfo endpoint to decode and validate
 * the token, then creates a session for the matching database user.
 *
 * Flow:
 *  1. Client signs in with Google → receives a credential (JWT ID token)
 *  2. Client sends the token to this endpoint
 *  3. Server verifies token with Google's OAuth2 tokeninfo API
 *  4. Server checks the email against our database
 *  5. Server sets session cookies on success
 *
 * Note: Only pre-registered users (created by admin) can log in via Google.
 * Unregistered Google accounts are rejected with a 404.
 */
export async function POST(request) {
  try {
    await connectDB();
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Google ID token is required' },
        { status: 400 }
      );
    }

    // Verify the token by calling Google's public tokeninfo endpoint.
    // This returns the decoded payload if the token is valid and not expired.
    const googleVerifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );

    if (!googleVerifyRes.ok) {
      return NextResponse.json(
        { error: 'Invalid or expired Google credential' },
        { status: 401 }
      );
    }

    const payload = await googleVerifyRes.json();

    // Validate the audience (aud) claim — ensures the token was issued FOR our app,
    // not for a different Google application.
    const expectedClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (expectedClientId && payload.aud !== expectedClientId) {
      return NextResponse.json(
        { error: 'Google token audience mismatch' },
        { status: 401 }
      );
    }

    // Reject tokens where the email address has not been verified by Google
    if (payload.email_verified !== 'true' && payload.email_verified !== true) {
      return NextResponse.json(
        { error: 'Google account email is not verified' },
        { status: 401 }
      );
    }

    const email = payload.email;
    if (!email) {
      return NextResponse.json(
        { error: 'Could not retrieve email from Google account' },
        { status: 400 }
      );
    }

    // Find the user in our database — only pre-created accounts can log in
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        {
          error: `The Google account (${email}) is not registered in InsightEd. Please contact your administrator to request portal access.`,
        },
        { status: 404 }
      );
    }

    // Bootstrap: auto-promote to admin if this is the designated admin email
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && email.toLowerCase() === adminEmail.toLowerCase() && user.role !== 'admin') {
      await User.updateOne({ _id: user._id }, { role: 'admin' });
      user.role = 'admin';
    }

    // Build client-readable metadata (no password or sensitive fields)
    const userMetadata = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    const cookieStore = await cookies();

    // Client-readable cookie for personalising the UI
    cookieStore.set('insighted_user', JSON.stringify(userMetadata), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    // Determine Secure flag based on whether we're on HTTPS
    const url = new URL(request.url);
    const isSecure =
      url.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https';

    // HttpOnly session cookie — the user's DB _id; never readable by JS
    cookieStore.set('insighted_session', user._id.toString(), {
      httpOnly: true,
      secure: isSecure,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true, user: userMetadata });
  } catch (error) {
    console.error('Google Sign-In verification error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
