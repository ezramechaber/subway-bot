const axios = require('axios');
require('dotenv').config();

// Document-level scoped variables
const USER_ID = process.env.USER_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

async function createThreadsMediaContainer(content) {
  try {
    const response = await axios.post(`https://graph.threads.net/v1.0/${USER_ID}/threads`, {
      media_type: "TEXT",
      text: content,
      access_token: ACCESS_TOKEN
    });
    return response.data.id; // This is the media container ID
  } catch (error) {
    console.error('Error creating media container:', error.message);
    throw error;
  }
}

async function publishThreadsMediaContainer(containerIds) {
  try {
    const response = await axios.post(`https://graph.threads.net/v1.0/${USER_ID}/threads_publish`, {
      creation_id: containerIds,
      access_token: ACCESS_TOKEN
    });
    return response.data.id; // This is the published Threads Media ID
  } catch (error) {
   console.error('Error publishing media container:', error);
    throw error;
  }
}

async function postToThreads(content) {
  try {
    // Create media container
    console.log(content);
    console.log("Waiting to start container...");
    const containerId = await createThreadsMediaContainer(content);
    
    // Wait for 30 seconds (you might want to adjust this)
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log("Waiting for container...");
    
    // Publish the media container
    const publishedId = await publishThreadsMediaContainer(containerId);
    console.log("waiting to publish...");
    console.log('Successfully posted to Threads. Media ID:', publishedId);
    return publishedId;
  } catch (error) {
    console.error('Error posting to Threads:', error);
    throw error;
  }
}

module.exports = { postToThreads };