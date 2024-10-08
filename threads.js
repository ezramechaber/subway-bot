const axios = require('axios');

async function createThreadsMediaContainer(userId, accessToken, mediaType, content) {
  try {
    const response = await axios.post(`https://graph.threads.net/v1.0/${userId}/threads`, {
      media_type: mediaType,
      text: content.text,
      image_url: content.imageUrl,
      video_url: content.videoUrl,
      access_token: accessToken
    });
    return response.data.id; // This is the media container ID
  } catch (error) {
    console.error('Error creating media container:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function publishThreadsMediaContainer(userId, accessToken, containerIds) {
    try {
      const response = await axios.post(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
        creation_id: containerIds,
        access_token: accessToken
      });
      return response.data.id; // This is the published Threads Media ID
    } catch (error) {
      console.error('Error publishing media container:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async function postToThreads(userId, accessToken, mediaType, content) {
    try {
      // Create media container
      const containerId = await createThreadsMediaContainer(userId, accessToken, mediaType, content);
      
      // Wait for 30 seconds as recommended in the docs
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Publish the media container
      const publishedId = await publishThreadsMediaContainer(userId, accessToken, containerId);
      
      console.log('Successfully posted to Threads. Media ID:', publishedId);
      return publishedId;
    } catch (error) {
      console.error('Error posting to Threads:', error);
      throw error;
    }
  }
  
  // Usage example
  postToThreads(
    'YOUR_THREADS_USER_ID',
    'YOUR_ACCESS_TOKEN',
    'IMAGE', // or 'VIDEO', 'TEXT', 'CAROUSEL'
    {
      text: 'Your post text here',
      imageUrl: 'https://example.com/your-image.jpg' // for IMAGE type
    }
  );