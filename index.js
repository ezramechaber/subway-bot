const { getAlerts } = require('./subway');
const { postToThreads } = require('./threads');
const { postToBluesky } = require('./bluesky');
const fs = require('fs').promises;
require('dotenv').config();

// Configuration flags
const ENABLE_THREADS = process.env.ENABLE_THREADS === 'true';
const ENABLE_BLUESKY = process.env.ENABLE_BLUESKY === 'true';

console.log('Posting configuration:');
console.log('- Threads enabled:', ENABLE_THREADS);
console.log('- Bluesky enabled:', ENABLE_BLUESKY);

async function main() {
    try {
        const updates = await getAlerts();
        console.log('Number of new alerts:', updates.length);
        
        if (updates.length > 0) {
            for (const update of updates) {
                console.log('\nProcessing alert:', update.id);
                console.log('Alert text:', update.header);
                
                // Post to Threads if enabled
                if (ENABLE_THREADS) {
                    try {
                        console.log('Attempting to post to Threads...');
                        await postToThreads(update.header);
                        console.log('✅ Successfully posted to Threads');
                    } catch (error) {
                        console.error('❌ Error posting to Threads:', error.message);
                    }
                }
                
                // Post to Bluesky if enabled
                if (ENABLE_BLUESKY) {
                    try {
                        console.log('Attempting to post to Bluesky...');
                        await postToBluesky(update.header);
                        console.log('✅ Successfully posted to Bluesky');
                    } catch (error) {
                        console.error('❌ Error posting to Bluesky:', error.message);
                    }
                }
            }
            // Log the last processed alert ID
            console.log("Last processed alert ID:", updates[updates.length - 1].id);
        } else {
            console.log('No new alerts to post');
        }
    } catch (error) {
        console.error('Error in main process:', error.message);
    }
}

main();