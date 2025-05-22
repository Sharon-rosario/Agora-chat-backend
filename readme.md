API Endpoints
POST /api/auth/register: Register a user (email, password, role).
POST /api/auth/login: Login a user (email, password).
POST /api/chat/token: Generate Agora Chat token (channelName, userId).
POST /api/chat/message: Send a message (receiverId, message, channel).
GET /api/chat/history/:userId: Get chat history with a specific user.