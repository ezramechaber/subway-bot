const { postToBluesky } = require('./bluesky');
require('dotenv').config();

async function testBlueskyConnection() {
    console.log('Testing Bluesky connection...');
    console.log('Environment variables loaded:', {
        username: process.env.BLUESKY_USERNAME ? '✅ Set' : '❌ Not set',
        password: process.env.BLUESKY_PASSWORD ? '✅ Set' : '❌ Not set'
    });
    
    if (!process.env.BLUESKY_USERNAME || !process.env.BLUESKY_PASSWORD) {
        console.error('❌ Missing required environment variables. Please check your .env file.');
        return;
    }

    console.log('Using Bluesky handle:', process.env.BLUESKY_USERNAME);
    
    const testPost = '🚇 Testing MTA Subway Bot connection to Bluesky. This is a test post.';
    
    try {
        console.log('Attempting to post to Bluesky...');
        const postUri = await postToBluesky(testPost);
        console.log('✅ Success! Post created with URI:', postUri);
        console.log('You can view the post at:', `https://bsky.app/profile/${process.env.BLUESKY_USERNAME}/post/${postUri.split('/').pop()}`);
    } catch (error) {
        console.error('❌ Failed to post to Bluesky:', error.message);
        if (error.response) {
            console.error('Error details:', error.response.data);
        }
    }
}

// Run the test
testBlueskyConnection(); 