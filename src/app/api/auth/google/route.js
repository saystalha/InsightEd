import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await connectDB();
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Google ID token is required' }, { status: 400 });
    }

    // Securely verify token via Google OAuth tokeninfo API
    const googleVerifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    
    if (!googleVerifyRes.ok) {
      return NextResponse.json({ error: 'Invalid Google credential token' }, { status: 401 });
    }

    const payload = await googleVerifyRes.json();
    const email = payload.email;

    if (!email) {
      return NextResponse.json({ error: 'Could not retrieve email from Google account' }, { status: 400 });
    }

    // Check if the user is registered in the database
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { error: `The Google account (${email}) is not registered. Please contact your administrator to request portal credentials.` },
        { status: 404 }
      );
    }

    // Auto-promote to admin if email matches
    if (email.toLowerCase() === 'talhabilalchand4@gmail.com' && user.role !== 'admin') {
      await User.updateOne({ _id: user._id }, { role: 'admin' });
      user.role = 'admin';
    }

    // Create session cookies
    const cookieStore = await cookies();
    
    const userMetadata = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    // User info metadata cookie (client-readable)
    cookieStore.set('insighted_user', JSON.stringify(userMetadata), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    // Check if HTTPS is active
    const url = new URL(request.url);
    const isSecure = url.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';

    // HttpOnly Session cookie
    cookieStore.set('insighted_session', user._id.toString(), {
      httpOnly: true,
      secure: isSecure,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return NextResponse.json({
      success: true,
      user: userMetadata,
    });

  } catch (error) {
    console.error('Google Sign-In verification error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
