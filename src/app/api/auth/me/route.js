import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';

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
