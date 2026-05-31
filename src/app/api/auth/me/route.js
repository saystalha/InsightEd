import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('insighted_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { authenticated: false, error: 'No active session' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Find the user by ID and populate relational mappings
    const user = await User.findById(sessionCookie.value)
      .select('-password')
      .populate('teacher', 'firstName lastName email department')
      .populate('students', 'firstName lastName email rollNumber degreeBatch mappedSubject');

    if (!user) {
      // Clear invalid cookies if user is not found in database
      cookieStore.delete('insighted_session');
      cookieStore.delete('insighted_user');
      return NextResponse.json(
        { authenticated: false, error: 'User session invalid' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        subjects: user.subjects,
        rollNumber: user.rollNumber,
        degreeBatch: user.degreeBatch,
        teacher: user.teacher,
        mappedSubject: user.mappedSubject,
        students: user.students,
      },
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('insighted_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, currentPassword, password } = body;
    
    await connectDB();
    const user = await User.findById(sessionCookie.value);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();

    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
      }
      if (email.toLowerCase() !== user.email) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
          return NextResponse.json({ error: 'Email address is already in use' }, { status: 409 });
        }
        user.email = email.toLowerCase();
      }
    }

    if (password && password.trim() !== '') {
      if (!currentPassword || currentPassword.trim() === '') {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect current password. If you forgot it, please use the password recovery flow.' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        subjects: user.subjects,
        rollNumber: user.rollNumber,
        degreeBatch: user.degreeBatch,
      }
    });

  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
