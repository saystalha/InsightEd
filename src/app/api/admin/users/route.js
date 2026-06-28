import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import bcrypt from 'bcryptjs';
import { sendProvisioningEmail } from '@/lib/mailer';
import { checkAdminAuth } from '@/lib/authHelper';

/**
 * GET /api/admin/users
 *
 * Returns all users in the system (excluding password fields).
 * Populates the `teacher` field for student accounts.
 * Results are sorted newest-first.
 *
 * Admin access only.
 */
export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();

    // Fetch all users, omit passwords, populate teacher reference, sort by creation date
    const users = await User.find({})
      .select('-password')
      .populate('teacher', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Admin GET users error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 *
 * Creates a new user account (teacher, student, or admin).
 * After creation:
 *   - If the new user is a student with a mapped teacher, the teacher's
 *     `students` array is updated to include the new student.
 *   - An audit log entry is written.
 *   - A provisioning email is sent to the new user with their credentials.
 *
 * Admin access only.
 */
export async function POST(request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const body = await request.json();
    const {
      firstName, lastName, email, password, role,
      department, subjects, rollNumber, degreeBatch,
      teacher, mappedSubject,
    } = body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'First name, last name, email, password, and role are all required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (!['teacher', 'student', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    // Check for duplicate roll number (students only)
    if (role === 'student' && rollNumber) {
      const existingRoll = await User.findOne({ rollNumber: rollNumber.trim() });
      if (existingRoll) {
        return NextResponse.json(
          { error: 'A student with this roll number is already registered' },
          { status: 409 }
        );
      }
    }

    // ── Hash password ─────────────────────────────────────────────────────
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ── Build the user document ───────────────────────────────────────────
    const userDoc = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    };

    // Attach teacher-specific fields
    if (role === 'teacher') {
      userDoc.department = department ? department.trim() : '';
      if (subjects) {
        userDoc.subjects = Array.isArray(subjects)
          ? subjects.map((s) => s.trim())
          : subjects.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    // Attach student-specific fields and validate teacher mapping if provided
    if (role === 'student') {
      userDoc.rollNumber = rollNumber ? rollNumber.trim() : undefined;
      userDoc.degreeBatch = degreeBatch ? degreeBatch.trim() : '';

      if (teacher) {
        // Verify the assigned teacher exists and has the correct role
        const teacherObj = await User.findById(teacher);
        if (!teacherObj || teacherObj.role !== 'teacher') {
          return NextResponse.json(
            { error: 'Assigned teacher not found' },
            { status: 404 }
          );
        }

        // Verify the teacher actually teaches the selected subject
        if (mappedSubject) {
          const subjectNormalized = mappedSubject.trim();
          if (!teacherObj.subjects.includes(subjectNormalized)) {
            return NextResponse.json(
              {
                error: `The selected teacher does not teach the course: ${subjectNormalized}`,
              },
              { status: 400 }
            );
          }
          userDoc.teacher = teacherObj._id;
          userDoc.mappedSubject = subjectNormalized;
        }
      }
    }

    // ── Create the user document ──────────────────────────────────────────
    const newUser = await User.create(userDoc);

    // If a student was mapped to a teacher, add this student to the teacher's
    // `students` array using $addToSet to prevent duplicates
    let teacherName = '';
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

    // ── Write Audit Log ───────────────────────────────────────────────────
    let details = `Created ${role}: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`;
    if (role === 'teacher' && newUser.department) {
      details += ` — Department: ${newUser.department}`;
    } else if (role === 'student' && newUser.rollNumber) {
      details += ` — Roll No: ${newUser.rollNumber}`;
    }
    if (role === 'student' && newUser.teacher && newUser.mappedSubject) {
      details += ` — Mapped to ${teacherName} for "${newUser.mappedSubject}"`;
    }

    await AuditLog.create({
      action: 'USER_PROVISIONED',
      details,
      performedBy: auth.currentUser.email,
    });

    // Dynamic appUrl resolution from incoming request host headers
    const reqUrl = new URL(request.url);
    const origin = reqUrl.origin;

    // ── Send welcome/credentials email to the new user ────────────────────
    const emailResult = await sendProvisioningEmail({
      email: newUser.email,
      password,           // Plain-text password sent once in the welcome email
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      teacherName: teacherName || undefined,
      mappedSubject: newUser.mappedSubject || undefined,
      appUrl: origin,
    });

    // Build the response payload (never include the hashed password)
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
      emailSent: emailResult?.success ?? false,
      emailError: !emailResult?.success ? (emailResult?.error ?? 'Unknown email error') : null,
    });
  } catch (error) {
    console.error('Admin POST user error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
