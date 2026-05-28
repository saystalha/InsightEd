import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { cookies } from 'next/headers';

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

export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Admin GET audit logs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
