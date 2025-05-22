const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  generateChatToken,
  sendMessage,
  getChatHistory,
  deleteMessage,
  handleCallRequest,
  endCall,
  getUsers,
} = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

// Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.post('/token', authMiddleware, generateChatToken);
router.post('/message', authMiddleware, upload.single('file'), sendMessage);
router.get('/history/:userId', authMiddleware, getChatHistory);
router.delete('/message/:messageId', authMiddleware, deleteMessage);
router.post('/call', authMiddleware, handleCallRequest);
router.post('/call/end', authMiddleware, endCall);
router.get('/users', authMiddleware, getUsers);

module.exports = router;