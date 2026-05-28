import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    performedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models && mongoose.models.AuditLog) {
  delete mongoose.models.AuditLog;
}

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
