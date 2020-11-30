const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const communitySchema = new Schema({
    communityId: { type: String, required: true, default: () => uuidv4() },
    communityName: { type: String, required: true, default: '' },
    author: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    allowPrivateChat: { type: Boolean, default: false },
    createdDate: { type: Date, default: () => Date.now() },
    subscribers: { type: Number, default: 0 },
    communityPic: { type: String, default: '' },
    commonFriend: { type: Number, default: 0 },
    isSubscribed: { type: Boolean, default: false },
    mimeType: { type: String, default: '' },
}, { collection: 'Community' });

const CommunityModel = mongoose.model('Community', communitySchema);

module.exports = CommunityModel;