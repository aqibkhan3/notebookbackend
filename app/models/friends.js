const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const friendsSchema = new Schema({
  threadId: { type: String, required: true, default: '' },
  userId: { type: String, required: true, default: '' },
  friendId: { type: String, required: true, default: '' },
}, { collection: 'Friends' });

const FriendsModel = mongoose.model('Friends', friendsSchema);

module.exports = FriendsModel;