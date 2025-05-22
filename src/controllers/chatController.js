const { ChatTokenBuilder } = require('agora-token');
const Message = require('../models/Message');
const User = require('../models/User');
const s3 = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

const generateChatToken = async (req, res) => {
  const { channelName } = req.body;
  const { id: requesterId } = req.user;

  try {
    const user = await User.findById(requesterId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const appId = process.env.APP_ID;
    const appCertificate = process.env.APP_CERTIFICATE;
    const expirationInSeconds = parseInt(process.env.TOKEN_EXPIRATION);

    const token = ChatTokenBuilder.buildUserToken(
      appId,
      appCertificate,
      user.agoraUid,
      expirationInSeconds
    );

    res.json({ token, channelName, agoraUid: user.agoraUid });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const uploadFileToS3 = async (file, type) => {
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${type}/${fileName}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  const { Location } = await s3.upload(params).promise();
  return Location;
};

const sendMessage = async (req, res) => {
  const { receiverId, type, content, channel, replyTo, tagged } = req.body;
  const { id: senderId } = req.user;
  let finalContent = content;

  try {
    if (['image', 'audio', 'video', 'file', 'doc'].includes(type)) {
      if (!req.file) return res.status(400).json({ error: 'File required for this message type' });
      finalContent = await uploadFileToS3(req.file, type);
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      channel,
      type,
      content: finalContent,
      replyTo: replyTo || null,
      tagged: tagged || false,
      callStatus: type === 'callRequest' ? 'pending' : null,
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getChatHistory = async (req, res) => {
  const { userId } = req.params;
  const { id: requesterId } = req.user;

  try {
    const messages = await Message.find({
      $or: [
        { sender: requesterId, receiver: userId },
        { sender: userId, receiver: requesterId },
      ],
    })
      .populate('sender', 'email role agoraUid')
      .populate('receiver', 'email role agoraUid')
      .populate('replyTo', 'content type sender')
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const { id: requesterId } = req.user;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.sender.toString() !== requesterId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await message.remove();
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const handleCallRequest = async (req, res) => {
  const { messageId, action } = req.body;
  const { id: requesterId } = req.user;

  try {
    const message = await Message.findById(messageId);
    if (!message || message.type !== 'callRequest') {
      return res.status(404).json({ error: 'Call request not found' });
    }
    if (message.receiver.toString() !== requesterId) {
      return res.status(403).json({ error: 'Not authorized to handle this call' });
    }

    if (action === 'accept') {
      message.callStatus = 'accepted';
    } else if (action === 'reject') {
      message.callStatus = 'rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const endCall = async (req, res) => {
  const { messageId, duration } = req.body;
  const { id: requesterId } = req.user;

  try {
    const message = await Message.findById(messageId);
    if (!message || !['audioCall', 'videoCall'].includes(message.type)) {
      return res.status(404).json({ error: 'Call not found' });
    }
    if (message.sender.toString() !== requesterId && message.receiver.toString() !== requesterId) {
      return res.status(403).json({ error: 'Not authorized to end this call' });
    }

    message.callStatus = 'ended';
    message.callDuration = duration;
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select('email role agoraUid');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  generateChatToken,
  sendMessage,
  getChatHistory,
  deleteMessage,
  handleCallRequest,
  endCall,
  getUsers,
};