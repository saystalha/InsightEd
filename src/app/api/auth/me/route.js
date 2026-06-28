import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

/**
 * GET /api/auth/me
 *
 * Returns the full profile of the currently authenticated user.
 * Reads the HttpOnly `insighted_session` cookie to identify the user,
 * then fetches and populates their relational data:
 *   - For students: populates the assigned teacher's details
 *   - For teachers: populates the list of assigned students
 *
 * Returns 401 if no valid session is found.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('insighted_session');

    // Reject unauthenticated requests
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { authenticated: false, error: 'No active session' },
        { status: 401 }
      );
    }

    await connectDB();

    // Fetch user by session ID, excluding the password field for security.
    // Populate teacher and students references so the dashboard has all
    // relational data in a single request.
    const user = await User.findById(sessionCookie.value)
      .select('-password')
      .populate('teacher', 'firstName lastName email department')
      .populate('students', 'firstName lastName email rollNumber degreeBatch mappedSubject');

    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: 'User session is invalid or has been deleted' },
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
        teacher: user.teacher,       // Populated teacher object (for students)
        mappedSubject: user.mappedSubject,
        students: user.students,     // Populated students array (for teachers)
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

/**
 * PUT /api/auth/me
 *
 * Allows the currently authenticated user to update their own profile.
 * Supported updates:
 *   - firstName, lastName
 *   - email (checked for uniqueness)
 *   - password (requires currentPassword for verification)
 *
 * On success, also refreshes the `insighted_user` client cookie so the
 * navbar/header reflects the updated name and email immediately.
 */
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

    // Fetch the full user document (including hashed password for comparison)
    const user = await User.findById(sessionCookie.value);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update name fields if provided
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();

    // Update email if provided and different from the current email
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }
      if (email.toLowerCase() !== user.email) {
        // Check that the new email is not already used by another account
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
          return NextResponse.json(
            { error: 'This email address is already in use by another account' },
            { status: 409 }
          );
        }
        user.email = email.toLowerCase();
      }
    }

    // Update password if a new one was provided
    if (password && password.trim() !== '') {
      // Require the current password before allowing a change
      if (!currentPassword || currentPassword.trim() === '') {
        return NextResponse.json(
          { error: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }

      // Verify the current password against the stored hash
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          {
            error:
              'Incorrect current password. If you forgot it, use the password recovery flow.',
          },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      // Hash the new password before storing
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    // Refresh the client-readable metadata cookie so the UI updates immediately
    const userMetadata = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
    cookieStore.set('insighted_user', JSON.stringify(userMetadata), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

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
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
