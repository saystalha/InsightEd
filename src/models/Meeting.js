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
    enum: ['student', 'teacher', 'observer'],
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
    // Used to prune stale participants in the GET handler.
    type: Date,
    default: Date.now,
  },
});

/**
 * MessageSchema
 * Embedded sub-document for a single chat message within a meeting.
 */
const MessageSchema = new mongoose.Schema({
  clientMsgId: {
    // Client-generated ID used to deduplicate optimistic UI messages against DB polls
    type: String,
  },
  sender: {
    // Display name of the sender
    type: String,
    required: true,
  },
  msg: {
    // The message text — stored as-is; escaped by React on render
    type: String,
    required: true,
  },
  time: {
    // Formatted time string (e.g. "10:35 AM")
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'observer'],
    default: 'student',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * TopicMarkerSchema
 * Records a topic/chapter boundary set by the host during a live session.
 */
const TopicMarkerSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  cfi: {
    type: Number,
    required: true,
  },
});

/**
 * WaitingParticipantSchema
 * Embedded sub-document for participants knocking/waiting for host permission.
 */
const WaitingParticipantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  peerId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  initials: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'observer'],
    default: 'student',
  },
  status: {
    type: String,
    enum: ['waiting', 'admitted', 'denied'],
    default: 'waiting',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
});

const GlobalPinSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['participant', 'screen'],
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

/**
 * MeetingSchema
 * Represents a single live classroom session.
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
    teacherId: {
      // Reference to the creator's User document for authoritative host checks
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    teacherName: {
      // Denormalized teacher name for quick display
      type: String,
      required: true,
    },
    threshold: {
      // Class Focus Index alert threshold (10–80%) configured at session creation
      type: Number,
      default: 40,
    },
    active: {
      // Set to false only when the creator explicitly ends the session
      type: Boolean,
      default: true,
    },

    // ── Embedded arrays ──────────────────────────────────────────────────
    participants: [ParticipantSchema],
    waitingRoom: [WaitingParticipantSchema],
    globalPin: {
      type: GlobalPinSchema,
      default: null,
    },
    messages: [MessageSchema],
    topicMarkers: [TopicMarkerSchema],

    // ── Aggregate engagement metrics ─────────────────────────────────────
    cfi: {
      type: Number,
      default: 75,
    },
    attention: {
      type: Number,
      default: 0.75,
    },
    confusion: {
      type: Number,
      default: 0.20,
    },
    energy: {
      type: Number,
      default: 0.70,
    },
  },
  {
    timestamps: true,
  }
);

if (
  mongoose.models.Meeting &&
  (!mongoose.models.Meeting.schema.path('waitingRoom') ||
    !mongoose.models.Meeting.schema.path('globalPin'))
) {
  delete mongoose.models.Meeting;
}

export default mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);