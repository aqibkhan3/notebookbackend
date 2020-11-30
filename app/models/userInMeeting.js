const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const UserInMeetingSchema = new Schema({
    id: { type: String, required: true, default: () => uuidv4() },
    userId: { type: String, required: true, default: '' },
}, { collection: 'UserInMeeting' });

const UserInMeetingModel = mongoose.model('UserInMeeting', UserInMeetingSchema);
module.exports = UserInMeetingModel;