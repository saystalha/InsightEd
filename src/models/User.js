import mongoose from 'mongoose';

/**
 * User Schema
 *
 * Supports three roles: 'admin', 'teacher', 'student'.
 * Role-specific fields are grouped below and are only populated
 * when the corresponding role is assigned.
 */
const UserSchema = new mongoose.Schema(
  {
    // ── Core identity fields (required for all roles) ─────────────────────
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,  // More permissive email regex (supports + and long TLDs)
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },

    // ── Role ──────────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: ['teacher', 'student', 'admin'],
      default: 'student',
    },

    // ── Teacher-specific fields ───────────────────────────────────────────
    // These are only meaningful when role === 'teacher'
    department: {
      type: String,
      trim: true,
    },
    subjects: {
      // List of subject/course names this teacher teaches
      type: [String],
      default: [],
    },
    students: [
      {
        // References to User documents (students) assigned to this teacher
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // ── Student-specific fields ───────────────────────────────────────────
    // These are only meaningful when role === 'student'
    rollNumber: {
      type: String,
      trim: true,
      // sparse allows multiple null values while still enforcing uniqueness for non-null values
      index: { unique: true, sparse: true },
    },
    degreeBatch: {
      type: String,
      trim: true,
    },
    teacher: {
      // Reference to the teacher User this student is assigned to
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true, // Index to speed up "find all students for a teacher" queries
    },
    mappedSubject: {
      // The specific subject this student is taking under their assigned teacher
      type: String,
      trim: true,
    },

    // ── Password Reset fields ─────────────────────────────────────────────
    // Temporary token generated when a user requests a password reset link
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      // Expiry timestamp — token is invalid after this date
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

/**
 * Model export using the standard Next.js / serverless-safe pattern.
 *
 * `mongoose.models.User` is checked first to avoid the "Cannot overwrite model"
 * error that occurs when this module is imported multiple times (e.g., during
 * hot-reload in development or across multiple route handlers in the same process).
 */
export default mongoose.models.User || mongoose.model('User', UserSchema);
