import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { sendResetPasswordEmail } from '@/lib/mailer';
import crypto from 'crypto';

/**
 * POST /api/auth/forgot-password
 *
 * Initiates the password reset flow:
 *  1. Looks up the user by email
 *  2. Generates a cryptographically secure random token
 *  3. Stores the token + a 1-hour expiry on the user document
 *  4. Sends an email with a link containing the token
 *
 * Security note: The response is identical whether or not the email is registered.
 * This prevents email enumeration attacks (an attacker cannot determine which
 * emails are in the system by observing the response).
 */
export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validate that an email was submitted
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Return the same success response regardless of whether the user exists
    // to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If that email is registered, a reset link has been sent.',
      });
    }

    // Generate a 32-byte (256-bit) cryptographically secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Store the plain token and set an expiry 1 hour from now
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3_600_000; // 1 hour in milliseconds
    await user.save();

    // Dynamic appUrl resolution from incoming request host headers
    const reqUrl = new URL(request.url);
    const origin = reqUrl.origin;

    // Send the reset email — includes a link with the token as a query param
    const mailResult = await sendResetPasswordEmail({
      email: user.email,
      token,
      firstName: user.firstName,
      lastName: user.lastName,
      appUrl: origin,
    });

    // If the email failed to send, report the error (the token is still saved;
    // the user can request again and it will overwrite the existing token)
    if (!mailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send recovery email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
