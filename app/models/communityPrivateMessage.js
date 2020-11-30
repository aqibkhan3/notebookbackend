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

const communityPrivateMessagesSchema = new Schema(
  {
    chatId: { type: String, required: true },
    msg: [messagesSchema],
  },
  { collection: 'CommunityPrivateMessages' }
);

const CommunityPrivateMessagesSchemaModel = mongoose.model('CommunityPrivateMessages', communityPrivateMessagesSchema);
module.exports = CommunityPrivateMessagesSchemaModel;
