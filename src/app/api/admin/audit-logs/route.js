import { NextResponse } from 'next/server';
import AuditLog from '@/models/AuditLog';
import { checkAdminAuth } from '@/lib/authHelper';

/**
 * GET /api/admin/audit-logs
 *
 * Returns the 100 most recent audit log entries, sorted newest-first.
 * These entries record significant admin actions such as user creation,
 * deletion, relationship mapping, and classroom events.
 *
 * Admin access only.
 */
export async function GET() {
  try {
    // Verify the requester is an authenticated admin
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Fetch the most recent 100 entries (newest first)
    // connectDB is called inside checkAdminAuth, so the connection is ready here
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Admin GET audit logs error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
