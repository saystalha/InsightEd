import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Helper function to verify admin status
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('insighted_session');
  
  if (!sessionCookie || !sessionCookie.value) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  await connectDB();
  const currentUser = await User.findById(sessionCookie.value);
  if (!currentUser || currentUser.role !== 'admin') {
    return { authorized: false, error: 'Forbidden', status: 403 };
  }

  return { authorized: true, currentUser };
}

// GET: Retrieve all users (admin only)
export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Admin GET users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new user (admin only)
export async function POST(request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { firstName, lastName, email, password, role } = body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (!['teacher', 'student', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    // Check duplication
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 409 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    const userMetadata = {
      _id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json({ success: true, user: userMetadata });
  } catch (error) {
    console.error('Admin POST user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
