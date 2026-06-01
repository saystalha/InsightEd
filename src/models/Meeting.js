import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  name: {
    type: String,
    required: true
  },
  initials: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student'
  },
  score: {
    type: Number,
    default: 75
  },
  handRaised: {
    type: Boolean,
    default: false
  },
  camOff: {
    type: Boolean,
    default: false
  },
  muted: {
    type: Boolean,
    default: false
  },
  isSpeaking: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true
  },
  msg: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TopicMarkerSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  cfi: {
    type: Number,
    required: true
  }
});

const MeetingSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    teacherName: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    },
    participants: [ParticipantSchema],
    messages: [MessageSchema],
    topicMarkers: [TopicMarkerSchema],
    cfi: {
      type: Number,
      default: 75
    },
    attention: {
      type: Number,
      default: 0.75
    },
    confusion: {
      type: Number,
      default: 0.20
    },
    energy: {
      type: Number,
      default: 0.70
    }
  },
  {
    timestamps: true
  }
);

if (mongoose.models && mongoose.models.Meeting) {
  delete mongoose.models.Meeting;
}
export default mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
