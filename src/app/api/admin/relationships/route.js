import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { checkAdminAuth } from '@/lib/authHelper';

/**
 * GET /api/admin/relationships
 *
 * Returns all student-teacher relationships: students who have an assigned teacher.
 * Populates the teacher's name, email, and department for each student record.
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

    // Find all students with a teacher assigned ($ne null filters out unmapped students)
    const students = await User.find({ role: 'student', teacher: { $ne: null } })
      .select('firstName lastName email rollNumber degreeBatch teacher mappedSubject')
      .populate('teacher', 'firstName lastName email department');

    return NextResponse.json({ success: true, relationships: students });
  } catch (error) {
    console.error('GET relationships error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/relationships
 *
 * Creates or updates a student-teacher mapping.
 *
 * Flow:
 *  1. Validates the student, teacher, and subject exist
 *  2. Verifies the teacher teaches the given subject
 *  3. If the student was previously mapped to a different teacher, removes
 *     the student from the old teacher's `students` array
 *  4. Updates the student document with the new teacher + subject
 *  5. Adds the student to the new teacher's `students` array (using $addToSet
 *     to prevent duplicates — ObjectId .includes() does not work for comparison)
 *  6. Writes an audit log entry
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
    const { studentId, teacherId, subject } = body;

    if (!studentId || !teacherId || !subject) {
      return NextResponse.json(
        { error: 'Student ID, Teacher ID, and Subject are all required' },
        { status: 400 }
      );
    }

    // Validate student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Validate teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Validate the teacher teaches this subject
    const subjectNormalized = subject.trim();
    if (!teacher.subjects.includes(subjectNormalized)) {
      return NextResponse.json(
        { error: `The selected teacher does not teach the course: ${subjectNormalized}` },
        { status: 400 }
      );
    }

    // If the student is currently mapped to a different teacher, remove the
    // student from that teacher's `students` array before reassigning
    if (student.teacher && student.teacher.toString() !== teacherId) {
      await User.updateOne(
        { _id: student.teacher },
        { $pull: { students: student._id } }
      );
    }

    // Update the student with the new mapping
    student.teacher = teacher._id;
    student.mappedSubject = subjectNormalized;
    await student.save();

    // Add the student to the new teacher's `students` array.
    // $addToSet is used instead of .includes() because ObjectId objects
    // are reference types — .includes() always returns false even when
    // the same ID exists in the array. $addToSet compares by value in MongoDB.
    await User.updateOne(
      { _id: teacher._id },
      { $addToSet: { students: student._id } }
    );

    // Audit log
    const details = `Mapped student ${student.firstName} ${student.lastName} (${student.rollNumber || student.email}) to teacher ${teacher.firstName} ${teacher.lastName} for subject "${subjectNormalized}"`;
    await AuditLog.create({
      action: 'RELATIONSHIP_MAPPED',
      details,
      performedBy: auth.currentUser.email,
    });

    return NextResponse.json({ success: true, message: 'Relationship mapped successfully' });
  } catch (error) {
    console.error('POST relationship error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/relationships?studentId=<id>
 *
 * Removes the student-teacher mapping for a given student.
 * Clears `teacher` and `mappedSubject` from the student document,
 * and removes the student from the teacher's `students` array.
 *
 * Admin access only.
 */
export async function DELETE(request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required as a query parameter' },
        { status: 400 }
      );
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const formerTeacherId = student.teacher;
    const formerSubject = student.mappedSubject;

    if (!formerTeacherId) {
      return NextResponse.json(
        { error: 'This student is not currently mapped to any teacher' },
        { status: 400 }
      );
    }

    // Fetch the former teacher for the audit log entry
    const teacherObj = await User.findById(formerTeacherId);

    // Clear mapping fields on the student
    student.teacher = undefined;
    student.mappedSubject = undefined;
    await student.save();

    // Remove the student ID from the teacher's students array
    await User.updateOne(
      { _id: formerTeacherId },
      { $pull: { students: student._id } }
    );

    // Audit log
    const teacherName = teacherObj
      ? `${teacherObj.firstName} ${teacherObj.lastName}`
      : 'Unknown (deleted)';
    const details = `Unmapped student ${student.firstName} ${student.lastName} from teacher ${teacherName} (was teaching "${formerSubject}")`;
    await AuditLog.create({
      action: 'RELATIONSHIP_UNMAPPED',
      details,
      performedBy: auth.currentUser.email,
    });

    return NextResponse.json({ success: true, message: 'Relationship removed successfully' });
  } catch (error) {
    console.error('DELETE relationship error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
