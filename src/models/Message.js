const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'audio', 'video', 'file', 'doc', 'image', 'audioCall', 'videoCall', 'callRequest'],
    required: true,
  },
  content: { type: String, required: true }, // Text or S3 URL for media
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  tagged: { type: Boolean, default: false },
  callStatus: { type: String, enum: ['pending', 'accepted', 'rejected', 'ended'], default: null },
  callDuration: { type: Number, default: null }, // In seconds
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);