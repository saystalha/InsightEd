import mongoose from 'mongoose';

/**
 * ParticipantSchema
 * Embedded sub-document for each person in an active classroom session.
 * Updated on join and periodically via heartbeat requests.
 */
const ParticipantSchema = new mongoose.Schema({
  userId: {
    // Reference to the User document — optional for guest/anonymous participants
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
  },
  initials: {
    // Two-letter abbreviation displayed as avatar fallback
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student',
  },
  score: {
    // Engagement/comprehension score (0–100), updated from client metrics
    type: Number,
    default: 75,
  },
  handRaised: {
    type: Boolean,
    default: false,
  },
  camOff: {
    type: Boolean,
    default: false,
  },
  muted: {
    type: Boolean,
    default: false,
  },
  isSpeaking: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    // Timestamp of the most recent heartbeat from this participant.
    // Used to prune stale participants (inactive > 15 s) in GET handler.
    type: Date,
    default: Date.now,
  },
});

/**
 * MessageSchema
 * Embedded sub-document for a single chat message within a meeting.
 */
const MessageSchema = new mongoose.Schema({
  sender: {
    // Display name of the sender
    type: String,
    required: true,
  },
  msg: {
    // The message text — stored as-is; sanitize on the client before rendering as HTML
    type: String,
    required: true,
  },
  time: {
    // Formatted time string (e.g. "10:35 AM") — stored for display convenience
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * TopicMarkerSchema
 * Records a topic/chapter boundary set by the teacher during a live session.
 * Used in the post-session analytics timeline.
 */
const TopicMarkerSchema = new mongoose.Schema({
  label: {
    // Topic name or description
    type: String,
    required: true,
  },
  time: {
    // Session elapsed time when the marker was placed (e.g. "00:12:30")
    type: String,
    required: true,
  },
  cfi: {
    // Class Focus Index at the moment the marker was placed (snapshot for the timeline)
    type: Number,
    required: true,
  },
});

/**
 * MeetingSchema
 * Represents a single live classroom session.
 * Contains embedded participants, messages, and topic markers.
 */
const MeetingSchema = new mongoose.Schema(
  {
    code: {
      // Short, unique join code displayed to students (e.g. "AB3X7Z")
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    teacherName: {
      // Denormalised teacher name for quick display without a join
      type: String,
      required: true,
    },
    active: {
      // Set to false when the teacher ends the session
      type: Boolean,
      default: true,
    },

    // ── Embedded arrays (kept in-document for fast real-time access) ──────
    participants: [ParticipantSchema],
    messages: [MessageSchema],      // Chat messages — consider a separate collection for large classes
    topicMarkers: [TopicMarkerSchema],

    // ── Aggregate engagement metrics ─────────────────────────────────────
    // Recalculated on each GET from participant scores
    cfi: {
      // Class Focus Index — average comprehension score (0–100)
      type: Number,
      default: 75,
    },
    attention: {
      // Proportion of students paying attention (0.0–1.0)
      type: Number,
      default: 0.75,
    },
    confusion: {
      // Estimated confusion level (0.0–1.0), inversely derived from score
      type: Number,
      default: 0.20,
    },
    energy: {
      // Estimated class energy level (0.0–1.0)
      type: Number,
      default: 0.70,
    },
  },
  {
    timestamps: true, // Adds createdAt (session start) and updatedAt
  }
);

/**
 * Safe model export pattern for Next.js.
 * Reuses the compiled model if it already exists to prevent
 * "Cannot overwrite model" errors during hot-reload.
 */
export default mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
