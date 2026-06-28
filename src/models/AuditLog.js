import mongoose from 'mongoose';

/**
 * AuditLog Schema
 *
 * Records all significant admin/system actions for traceability.
 * Entries are immutable — only created, never updated or deleted.
 *
 * Each document captures:
 *   - what happened (action)
 *   - a human-readable description (details)
 *   - who triggered it (performedBy — email address of the acting user)
 *   - when it happened (createdAt — from timestamps)
 */
const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      // Enum ensures only valid, pre-defined action codes are stored.
      // This prevents typos like 'CLASSROOM_CREATD' from slipping through.
      enum: [
        'USER_PROVISIONED',    // Admin created a new user account
        'USER_UPDATED',        // Admin edited an existing user's details
        'USER_DELETED',        // Admin deleted a user account
        'RELATIONSHIP_MAPPED', // Admin mapped a student to a teacher + subject
        'RELATIONSHIP_UNMAPPED',// Admin removed a student–teacher mapping
        'CLASSROOM_CREATED',   // Teacher started a new live classroom session
        'CLASSROOM_JOINED',    // A user joined a live classroom session
        'CLASSROOM_ENDED',     // Teacher or admin ended a classroom session
        'PASSWORD_RESET',      // A user successfully reset their password
      ],
    },
    details: {
      // Free-text description of the action (e.g. "Deleted teacher: Jane Doe (jane@example.com)")
      type: String,
      required: true,
    },
    performedBy: {
      // Email address of the user who performed the action.
      // Stored as a string snapshot so historical logs remain accurate even
      // if the user's email changes later.
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt = timestamp of the action; updatedAt is unused
  }
);

/**
 * Safe model export for Next.js — reuses the compiled model if it already
 * exists to prevent "Cannot overwrite model" errors during hot-reload.
 */
export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
