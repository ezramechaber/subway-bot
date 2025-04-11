const { BskyAgent } = require('@atproto/api');
require('dotenv').config();

const agent = new BskyAgent({
  service: 'https://bsky.social',
});

async function loginToBluesky() {
  try {
    await agent.login({
      identifier: process.env.BLUESKY_USERNAME,
      password: process.env.BLUESKY_PASSWORD,
    });
    return true;
  } catch (error) {
    console.error('Error logging into Bluesky:', error);
    return false;
  }
}

async function postToBluesky(content) {
  try {
    const isLoggedIn = await loginToBluesky();
    if (!isLoggedIn) {
      throw new Error('Failed to login to Bluesky');
    }

    const response = await agent.post({
      text: content,
    });

    return response.uri;
  } catch (error) {
    console.error('Error posting to Bluesky:', error);
    throw error;
  }
}

module.exports = { postToBluesky }; 