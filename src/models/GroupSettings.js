
const groupSettingsSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  privacy: { type: String, enum: ['open', 'closed', 'cloud'], default: 'closed' },
  allowMemberInvites: { type: Boolean, default: false }
});