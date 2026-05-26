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

// PUT: Update user details (admin only)
export async function PUT(request, { params }) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, email, role, password } = body;

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 444 });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
      }

      // Check unique constraint if email changed
      if (email.toLowerCase() !== userToUpdate.email) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
          return NextResponse.json({ error: 'Email address is already in use by another account' }, { status: 409 });
        }
        userToUpdate.email = email.toLowerCase();
      }
    }

    if (firstName) userToUpdate.firstName = firstName.trim();
    if (lastName) userToUpdate.lastName = lastName.trim();
    
    if (role) {
      if (!['teacher', 'student', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      
      // If updating role for self, prevent demotion to maintain at least one admin
      if (id === auth.currentUser._id.toString() && role !== 'admin') {
        return NextResponse.json({ error: 'You cannot demote yourself from Admin role' }, { status: 400 });
      }
      userToUpdate.role = role;
    }

    // Optional password reset
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }
      const salt = await bcrypt.genSalt(10);
      userToUpdate.password = await bcrypt.hash(password, salt);
    }

    await userToUpdate.save();

    return NextResponse.json({
      success: true,
      user: {
        _id: userToUpdate._id,
        email: userToUpdate.email,
        firstName: userToUpdate.firstName,
        lastName: userToUpdate.lastName,
        role: userToUpdate.role,
        createdAt: userToUpdate.createdAt,
      }
    });
  } catch (error) {
    console.error('Admin PUT user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete user (admin only)
export async function DELETE(request, { params }) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Prevent admin from deleting their own account
    if (id === auth.currentUser._id.toString()) {
      return NextResponse.json({ error: 'You cannot delete your own administrative account' }, { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 444 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin DELETE user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
