import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
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
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['teacher', 'student', 'admin'],
      default: 'student',
    },
    // Teacher specific fields
    department: {
      type: String,
      trim: true,
    },
    subjects: {
      type: [String],
      default: [],
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Student specific fields
    rollNumber: {
      type: String,
      trim: true,
      index: { unique: true, sparse: true },
    },
    degreeBatch: {
      type: String,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    mappedSubject: {
      type: String,
      trim: true,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent compiling model query cache issues in serverless route handler contexts and force schema updates in development
if (mongoose.models && mongoose.models.User) {
  delete mongoose.models.User;
}
export default mongoose.models.User || mongoose.model('User', UserSchema);
