import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email address or password' }, { status: 401 });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email address or password' }, { status: 401 });
    }

    // Auto-promote to admin if email matches
    if (email.toLowerCase() === 'talhabilalchand4@gmail.com' && user.role !== 'admin') {
      await User.updateOne({ _id: user._id }, { role: 'admin' });
      user.role = 'admin';
    }

    // Write token & profile info to cookies
    const cookieStore = await cookies();
    
    // Cookie for metadata (readable by client)
    const userMetadata = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
    cookieStore.set('insighted_user', JSON.stringify(userMetadata), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    // Session token cookie (HttpOnly for security)
    cookieStore.set('insighted_session', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return NextResponse.json({
      success: true,
      user: userMetadata,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
