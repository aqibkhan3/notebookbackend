const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const usersSchema = new Schema({
    id: { type: String, required: true, default: () => uuidv4() },
    fullname: { type: String, required: true, default: '' },
    username: { type: String, required: true, default: '' },
    email: { type: String, required: true, default: '' },
    password: { type: String, default: '' },
    active: { type: Number, required: true, default: 0 },
    age: { type: Number,  default: 16 },
    commonFriend: { type: Number, required: true, default: 0 },
    isFriend: { type: Boolean, required: true, default: false },
    totalConnection: { type: Number, required: true, default: 0 },
    phoneNumber: { type: String, required: true, default: '' },
    backgroundImg: { type: String, default: '' },
    occupation: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    isOnline: { type: Number, default: 0 },
    unReadMessagesLength: { type: Number, default: 0 },
    profilePic: { type: String, default: '' },
    mimeType: { type: String, default: '' },
}, { collection: 'Users' },
    { _id: false });

const UsersModel = mongoose.model('Users', usersSchema);
module.exports = UsersModel;