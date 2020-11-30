const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    senderId: { type: String, required: true, },
    senderName: { type: String, required: true, },
    messageText: { type: String },
    timestamp: { type: Date },
    attachmentId: { type: String },
    type: { type: String, required: true, default: 'text' },
    mimeType: { type: String },
    isRecieve: { type: Number, required: true, default: 0 },
    src: { type: String },
});

const chatSchema = new Schema({
    chatId: { type: String, required: true, },
    msg: [messageSchema],

}, { collection: 'Chat' });

const ChatModel = mongoose.model('Chat', chatSchema);

module.exports = ChatModel;