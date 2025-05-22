const axios = require('axios');

const BASE_URL = 'https://a61.chat.agora.io';
const APP_ID = process.env.AGORA_APP_ID;
const ORG_NAME = process.env.AGORA_ORG_NAME;
const APP_NAME = process.env.AGORA_APP_NAME;
const REST_USER = process.env.AGORA_REST_USER;
const REST_SECRET = process.env.AGORA_REST_SECRET;

const headers = {
  'Content-Type': 'application/json',
  Authorization: 'Basic ' + Buffer.from(`${REST_USER}:${REST_SECRET}`).toString('base64'),
};

exports.createAgoraUser = async (username, password) => {
  const url = `${BASE_URL}/${ORG_NAME}/${APP_NAME}/users`;
  try {
    await axios.post(url, { username, password }, { headers });
    return true;
  } catch (err) {
    console.error('Agora user creation failed', err.response?.data);
    return false;
  }
};
