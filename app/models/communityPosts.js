const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');

const userSchema = new Schema({
    username: { type: String, required: true, },
    userId: { type: String, required: true, },
    date: { type: String, required: true, },
    createdDate: { type: String },
},
    { _id: false }
);

const fileSchema = new Schema({
    type: { type: String, required: true, },
    name: { type: String, required: true, },
    title: { type: String },
    description: { type: String },
    like: [],
    dislike: [],
    comments: [userSchema],
    share: [userSchema],
    view: { type: Number, required: true, default: 0 },
    createdDate: { type: String, required: true, },
});

const articleSchema = new Schema({
    type: { type: String, required: true, default: 'text' },
    title: { type: String },
    description: { type: String },
    like: [],
    dislike: [],
    comments: [userSchema],
    share: [userSchema],
    view: { type: Number, required: true, default: 0 },
    createdDate: { type: String, required: true, },
},
    { _id: false });

const communityPostsSchema = new Schema({
    communityId: { type: String, required: true, },
    images: [fileSchema],
    docs: [fileSchema],
    articles: [articleSchema],
}, { collection: 'CommunityPosts' });

const CommunityPostsModel = mongoose.model('CommunityPosts', communityPostsSchema);
module.exports = CommunityPostsModel;