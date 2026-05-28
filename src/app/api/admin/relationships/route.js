import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
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

// GET: Retrieve all mapped relationships (students who have a mapped teacher)
export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Find students who have an assigned teacher
    const students = await User.find({ role: 'student', teacher: { $ne: null } })
      .select('firstName lastName email rollNumber degreeBatch teacher mappedSubject')
      .populate('teacher', 'firstName lastName email department');

    return NextResponse.json({ success: true, relationships: students });
  } catch (error) {
    console.error('GET relationships error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Establish student-to-teacher/subject relationship
export async function POST(request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { studentId, teacherId, subject } = body;

    if (!studentId || !teacherId || !subject) {
      return NextResponse.json({ error: 'Student, Teacher, and Subject are all required' }, { status: 400 });
    }

    // Find student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Find teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Validate that the subject is taught by the teacher
    const subjectNormalized = subject.trim();
    if (!teacher.subjects.includes(subjectNormalized)) {
      return NextResponse.json({ error: `Selected teacher does not teach course: ${subjectNormalized}` }, { status: 400 });
    }

    // Relational cleanup of old teacher if student was already mapped
    if (student.teacher && student.teacher.toString() !== teacherId) {
      await User.updateOne(
        { _id: student.teacher },
        { $pull: { students: student._id } }
      );
    }

    // Update Student
    student.teacher = teacher._id;
    student.mappedSubject = subjectNormalized;
    await student.save();

    // Update Teacher
    if (!teacher.students.includes(student._id)) {
      teacher.students.push(student._id);
      await teacher.save();
    }

    // Create Audit Log
    const details = `Mapped student ${student.firstName} ${student.lastName} (${student.rollNumber || student.email}) to teacher ${teacher.firstName} ${teacher.lastName} for subject "${subjectNormalized}"`;
    await AuditLog.create({
      action: 'RELATIONSHIP_MAPPED',
      details,
      performedBy: auth.currentUser.email,
    });

    return NextResponse.json({ success: true, message: 'Relationship mapped successfully' });
  } catch (error) {
    console.error('POST relationship error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove student relationship (unmap)
export async function DELETE(request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const formerTeacherId = student.teacher;
    const formerSubject = student.mappedSubject;

    if (!formerTeacherId) {
      return NextResponse.json({ error: 'Student is not mapped to any teacher' }, { status: 400 });
    }

    const teacherObj = await User.findById(formerTeacherId);

    // Unlink student
    student.teacher = undefined;
    student.mappedSubject = undefined;
    await student.save();

    // Unlink teacher
    await User.updateOne(
      { _id: formerTeacherId },
      { $pull: { students: student._id } }
    );

    // Create Audit Log
    const teacherName = teacherObj ? `${teacherObj.firstName} ${teacherObj.lastName}` : 'Unknown';
    const details = `Unmapped student ${student.firstName} ${student.lastName} from teacher ${teacherName} (was teaching "${formerSubject}")`;
    await AuditLog.create({
      action: 'RELATIONSHIP_UNMAPPED',
      details,
      performedBy: auth.currentUser.email,
    });

    return NextResponse.json({ success: true, message: 'Relationship removed successfully' });
  } catch (error) {
    console.error('DELETE relationship error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
