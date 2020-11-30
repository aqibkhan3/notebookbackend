const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messagesSchema = new Schema(
  {
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    messageText: { type: String },
    type: { type: String, required: true, default: 'text' },
    mimeType: { type: String },
    timestamp: { type: Date },
    attachmentId: { type: String },
    Receivers: [],
  },
  { _id: false }
);

const communityGroupMessagesSchema = new Schema(
  {
    communityId: { type: String, required: true },
    msg: [messagesSchema],
  },
  { collection: 'CommunityGroupMessages' }
);

const CommunityGroupMessagesModel = mongoose.model('CommunityGroupMessages', communityGroupMessagesSchema);
module.exports = CommunityGroupMessagesModel;
