import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import bcrypt from 'bcryptjs';
import { checkAdminAuth } from '@/lib/authHelper';

/**
 * PUT /api/admin/users/[id]
 *
 * Updates an existing user's profile fields.
 * Supported fields: firstName, lastName, email, role, password,
 *                   department, subjects (teachers), rollNumber, degreeBatch (students).
 *
 * Safeguards:
 *   - An admin cannot demote themselves (prevents lock-out)
 *   - Email uniqueness is checked before update
 *   - Roll number uniqueness is checked before update
 *
 * Admin access only.
 */
export async function PUT(request, { params }) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, email, role, password, department, subjects, rollNumber, degreeBatch } = body;

    // Find the user to update
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ── Email validation and uniqueness check ─────────────────────────────
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }

      if (email.toLowerCase() !== userToUpdate.email) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
          return NextResponse.json(
            { error: 'This email address is already in use by another account' },
            { status: 409 }
          );
        }
        userToUpdate.email = email.toLowerCase();
      }
    }

    // ── Basic field updates ───────────────────────────────────────────────
    if (firstName) userToUpdate.firstName = firstName.trim();
    if (lastName) userToUpdate.lastName = lastName.trim();

    // ── Role update with self-demotion protection ─────────────────────────
    if (role) {
      if (!['teacher', 'student', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      // Prevent the currently logged-in admin from demoting themselves
      // to avoid a situation where there are no admins left in the system
      if (id === auth.currentUser._id.toString() && role !== 'admin') {
        return NextResponse.json(
          { error: 'You cannot demote your own admin account' },
          { status: 400 }
        );
      }
      userToUpdate.role = role;
    }

    // ── Teacher-specific field updates ────────────────────────────────────
    if (userToUpdate.role === 'teacher') {
      if (department !== undefined) userToUpdate.department = department.trim();
      if (subjects !== undefined) {
        userToUpdate.subjects = Array.isArray(subjects)
          ? subjects.map((s) => s.trim())
          : subjects.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    // ── Student-specific field updates ────────────────────────────────────
    if (userToUpdate.role === 'student') {
      if (rollNumber !== undefined) {
        const trimmedRoll = rollNumber.trim();
        // Only check for duplicates if the roll number actually changed
        if (trimmedRoll && trimmedRoll !== userToUpdate.rollNumber) {
          const rollExists = await User.findOne({ rollNumber: trimmedRoll });
          if (rollExists) {
            return NextResponse.json(
              { error: 'This roll number is already assigned to another student' },
              { status: 409 }
            );
          }
        }
        userToUpdate.rollNumber = trimmedRoll || undefined;
      }
      if (degreeBatch !== undefined) userToUpdate.degreeBatch = degreeBatch.trim();
    }

    // ── Optional password reset by admin ──────────────────────────────────
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      const salt = await bcrypt.genSalt(10);
      userToUpdate.password = await bcrypt.hash(password, salt);
    }

    await userToUpdate.save();

    // Write an audit log entry for this update
    await AuditLog.create({
      action: 'USER_UPDATED',
      details: `Updated ${userToUpdate.role} profile: ${userToUpdate.firstName} ${userToUpdate.lastName} (${userToUpdate.email})`,
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
      },
    });
  } catch (error) {
    console.error('Admin PUT user error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 *
 * Permanently deletes a user account and cleans up relational data:
 *   - If deleting a teacher: unsets `teacher` and `mappedSubject` on all
 *     students who were assigned to them.
 *   - If deleting a student: removes the student's ID from their teacher's
 *     `students` array.
 *
 * Safeguard: An admin cannot delete their own account.
 *
 * Admin access only.
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const { id } = await params;

    // Prevent self-deletion to avoid accidentally removing the only admin account
    if (id === auth.currentUser._id.toString()) {
      return NextResponse.json(
        { error: 'You cannot delete your own administrative account' },
        { status: 400 }
      );
    }

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ── Relational cleanup ────────────────────────────────────────────────
    if (userToDelete.role === 'teacher') {
      // Remove the teacher reference from all students who were assigned to this teacher
      await User.updateMany(
        { teacher: id },
        { $unset: { teacher: '', mappedSubject: '' } }
      );
    } else if (userToDelete.role === 'student') {
      // Remove this student's ID from any teacher's students array
      await User.updateMany(
        { students: id },
        { $pull: { students: id } }
      );
    }

    // Delete the user document
    await User.findByIdAndDelete(id);

    // Write audit log
    await AuditLog.create({
      action: 'USER_DELETED',
      details: `Deleted ${userToDelete.role}: ${userToDelete.firstName} ${userToDelete.lastName} (${userToDelete.email})`,
      performedBy: auth.currentUser.email,
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin DELETE user error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
