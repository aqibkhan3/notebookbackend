const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');

const fileSchema = new Schema({
    type: { type: String, required: true, },
    size: { type: String, required: true, },
    name: { type: String, required: true, },
});

const chatSchema = new Schema({
    chatId: { type: String, required: true, },
    docs: [fileSchema],
    images: [fileSchema],

}, { collection: 'ChatFiles' });

const ChatFilesModel = mongoose.model('ChatFiles', chatSchema);

module.exports = ChatFilesModel;