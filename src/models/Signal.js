import mongoose from 'mongoose';

/**
 * SignalSchema
 * Stores ephemeral WebRTC signaling packets (offer, answer, ice-candidates, screen-share)
 * in MongoDB so that serverless environments (like Vercel) can exchange signals
 * across different lambda instances and devices.
 *
 * Automatically expires and cleans up via MongoDB TTL index (expires: 90s).
 */
const SignalSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      default: 'all',
    },
    type: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    senderName: {
      type: String,
      default: '',
    },
    senderRole: {
      type: String,
      default: 'student',
    },
    timestamp: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 90, // Auto-delete signals older than 90 seconds
    },
  },
  {
    timestamps: false,
  }
);

// Indexes for fast polling lookups
SignalSchema.index({ sessionId: 1, timestamp: 1 });
SignalSchema.index({ sessionId: 1, to: 1, from: 1 });

export default mongoose.models.Signal || mongoose.model('Signal', SignalSchema);
