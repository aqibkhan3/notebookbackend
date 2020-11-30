const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const recordingSchema = new Schema({
  id: { type: String, required: true, default: () => uuidv4() },
  userId: { type: String, required: true, },
  videoName: { type: String, required: true, },
  blobFileName: { type: String, required: true },
  createdDate: { type: Date, default: () => Date.now() }
}, { collection: 'Recordings' });

const RecordingModel = mongoose.model('Recordings', recordingSchema);
module.exports = RecordingModel;