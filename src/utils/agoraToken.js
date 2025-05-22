const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
require('dotenv').config();

const generateAgoraToken = (userId) => {
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const channelName = userId;
  const uid = 0;
  const role = RtcRole.PUBLISHER;
  const expireTime = 3600 * 24 * 30; // 30 days

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpire = currentTimestamp + expireTime;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpire
  );

  return token;
};

module.exports = generateAgoraToken;
