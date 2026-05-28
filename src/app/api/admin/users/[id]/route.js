import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
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
    const { firstName, lastName, email, role, password, department, subjects, rollNumber, degreeBatch } = body;

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    // Update teacher specific fields
    if (userToUpdate.role === 'teacher') {
      if (department !== undefined) userToUpdate.department = department.trim();
      if (subjects !== undefined) {
        userToUpdate.subjects = Array.isArray(subjects)
          ? subjects.map(s => s.trim())
          : subjects.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // Update student specific fields
    if (userToUpdate.role === 'student') {
      if (rollNumber !== undefined) {
        const trimmedRoll = rollNumber.trim();
        if (trimmedRoll && trimmedRoll !== userToUpdate.rollNumber) {
          const rollExists = await User.findOne({ rollNumber: trimmedRoll });
          if (rollExists) {
            return NextResponse.json({ error: 'This roll number is already in use' }, { status: 409 });
          }
        }
        userToUpdate.rollNumber = trimmedRoll || undefined;
      }
      if (degreeBatch !== undefined) userToUpdate.degreeBatch = degreeBatch.trim();
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

    // Audit Log
    await AuditLog.create({
      action: 'USER_UPDATED',
      details: `Updated user details for: ${userToUpdate.firstName} ${userToUpdate.lastName} (${userToUpdate.email})`,
      performedBy: auth.currentUser.email,
    });

    return NextResponse.json({
      success: true,
      user: {
        _id: userToUpdate._id,
        email: userToUpdate.email,
        firstName: userToUpdate.firstName,
        lastName: userToUpdate.lastName,
        role: userToUpdate.role,
        createdAt: userToUpdate.createdAt,
        department: userToUpdate.department,
        subjects: userToUpdate.subjects,
        rollNumber: userToUpdate.rollNumber,
        degreeBatch: userToUpdate.degreeBatch,
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

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Relational cleanup
    if (userToDelete.role === 'teacher') {
      // Unset teacher reference on all students mapped to this teacher
      await User.updateMany(
        { teacher: id },
        { $unset: { teacher: '', mappedSubject: '' } }
      );
    } else if (userToDelete.role === 'student') {
      // Pull student ID from all teachers' student arrays
      await User.updateMany(
        { students: id },
        { $pull: { students: id } }
      );
    }

    await User.findByIdAndDelete(id);

    // Audit Log
    await AuditLog.create({
      action: 'USER_DELETED',
      details: `Deleted ${userToDelete.role}: ${userToDelete.firstName} ${userToDelete.lastName} (${userToDelete.email})`,
      performedBy: auth.currentUser.email,
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin DELETE user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
