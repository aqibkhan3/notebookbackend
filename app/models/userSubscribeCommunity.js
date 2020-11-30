const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const UserSubscribeCommunitySchema = new Schema({
    id: { type: String, required: true, default: () => uuidv4() },
    userId: { type: String, required: true, default: '' },
    communityId: { type: String, required: true, default: '' },

}, { collection: 'UserSubscribeCommunity' });

const UserSubscribeCommunityModel = mongoose.model('UserSubscribeCommunity', UserSubscribeCommunitySchema);

module.exports = UserSubscribeCommunityModel;