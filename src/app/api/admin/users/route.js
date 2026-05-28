import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { sendProvisioningEmail } from '@/lib/mailer';

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

    const users = await User.find({})
      .select('-password')
      .populate('teacher', 'firstName lastName email')
      .sort({ createdAt: -1 });

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
    const { firstName, lastName, email, password, role, department, subjects, rollNumber, degreeBatch, teacher, mappedSubject } = body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json({ error: 'All primary fields are required' }, { status: 400 });
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

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 409 });
    }

    // Validation & unique check for students
    if (role === 'student' && rollNumber) {
      const existingRoll = await User.findOne({ rollNumber: rollNumber.trim() });
      if (existingRoll) {
        return NextResponse.json({ error: 'A student with this roll number is already registered' }, { status: 409 });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare create document
    const userDoc = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    };

    if (role === 'teacher') {
      userDoc.department = department ? department.trim() : '';
      if (subjects) {
        userDoc.subjects = Array.isArray(subjects)
          ? subjects.map(s => s.trim())
          : subjects.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (role === 'student') {
      userDoc.rollNumber = rollNumber ? rollNumber.trim() : undefined;
      userDoc.degreeBatch = degreeBatch ? degreeBatch.trim() : '';
      if (teacher) {
        // Verify teacher exists
        const teacherObj = await User.findById(teacher);
        if (!teacherObj || teacherObj.role !== 'teacher') {
          return NextResponse.json({ error: 'Assigned teacher not found' }, { status: 404 });
        }
        if (mappedSubject) {
          const subjectNormalized = mappedSubject.trim();
          if (!teacherObj.subjects.includes(subjectNormalized)) {
            return NextResponse.json({ error: `Selected teacher does not teach course: ${subjectNormalized}` }, { status: 400 });
          }
          userDoc.teacher = teacherObj._id;
          userDoc.mappedSubject = subjectNormalized;
        }
      }
    }

    // Create user
    const newUser = await User.create(userDoc);

    let teacherName = '';
    // If student was mapped to teacher, establish reference back in teacher document
    if (role === 'student' && newUser.teacher) {
      const teacherObj = await User.findByIdAndUpdate(
        newUser.teacher,
        { $addToSet: { students: newUser._id } },
        { new: true }
      );
      if (teacherObj) {
        teacherName = `${teacherObj.firstName} ${teacherObj.lastName}`;
      }
    }

    // Audit Log
    let details = `Created ${role}: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`;
    if (role === 'teacher' && newUser.department) {
      details += ` in department ${newUser.department}`;
    } else if (role === 'student' && newUser.rollNumber) {
      details += ` with roll number ${newUser.rollNumber}`;
    }
    if (role === 'student' && newUser.teacher && newUser.mappedSubject) {
      details += ` (Mapped to teacher ${teacherName} for subject "${newUser.mappedSubject}")`;
    }

    await AuditLog.create({
      action: 'USER_PROVISIONED',
      details,
      performedBy: auth.currentUser.email,
    });

    // Send Provisioning Email
    const emailResult = await sendProvisioningEmail({
      email: newUser.email,
      password: password, // Send plain text password
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      teacherName: teacherName || undefined,
      mappedSubject: newUser.mappedSubject || undefined,
    });

    const userMetadata = {
      _id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      createdAt: newUser.createdAt,
      department: newUser.department,
      subjects: newUser.subjects,
      rollNumber: newUser.rollNumber,
      degreeBatch: newUser.degreeBatch,
      teacher: newUser.teacher,
      mappedSubject: newUser.mappedSubject,
    };

    return NextResponse.json({ 
      success: true, 
      user: userMetadata,
      emailSent: emailResult ? emailResult.success : false,
      emailError: emailResult && !emailResult.success ? emailResult.error : null
    });
  } catch (error) {
    console.error('Admin POST user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
