import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/reset-password
 *
 * Completes the password reset flow:
 *  1. Validates the reset token from the URL (via the request body)
 *  2. Checks that the token has not expired (1-hour window)
 *  3. Hashes and saves the new password
 *  4. Clears the token fields so the link can only be used once
 *  5. Writes an audit log entry
 *
 * The user is NOT automatically logged in after reset — they are
 * redirected to the login page to sign in with their new password.
 */
export async function POST(request) {
  try {
    const { token, password } = await request.json();

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    if (!password || password.trim() === '') {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the user whose token matches AND hasn't expired yet
    // $gt: Date.now() ensures expired tokens are rejected even if the value matches
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            'This password reset link is invalid or has expired. Please request a new one.',
        },
        { status: 400 }
      );
    }

    // Hash the new password with a fresh salt (10 rounds is the recommended default)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear the reset token fields so this link cannot be reused
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Record the password reset in the audit log for security traceability
    await AuditLog.create({
      action: 'PASSWORD_RESET',
      details: `User ${user.firstName} ${user.lastName} (${user.email}) successfully reset their password via the recovery link.`,
      performedBy: user.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
