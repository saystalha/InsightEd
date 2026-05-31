import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { sendResetPasswordEmail } from '@/lib/mailer';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // For security reasons, don't disclose if the email exists or not
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If the email is registered, we have sent a reset password link to it."
      });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiry to 1 hour from now
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const mailResult = await sendResetPasswordEmail({
      email: user.email,
      token,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    if (!mailResult.success) {
      return NextResponse.json({ error: 'Failed to send recovery email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "If the email is registered, we have sent a reset password link to it."
    });
  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
