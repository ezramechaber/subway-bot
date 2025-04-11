const { getAlerts } = require('./subway');
const { postToThreads } = require('./threads');
const { postToBluesky } = require('./bluesky');
const fs = require('fs').promises;
require('dotenv').config();

// Configuration flags
const ENABLE_THREADS = process.env.ENABLE_THREADS === 'true';
const ENABLE_BLUESKY = process.env.ENABLE_BLUESKY === 'true';

async function main() {
    try {
        const updates = await getAlerts();
        console.log('Number of new alerts:', updates.length);
        
        if (updates.length > 0) {
            for (const update of updates) {
                const content = `${update.header}`;
                
                // Post to Threads if enabled
                if (ENABLE_THREADS) {
                    try {
                        await postToThreads(content);
                        console.log(`Posted to Threads: ${update.id}`);
                    } catch (error) {
                        console.error('Error posting to Threads:', error.message);
                    }
                }
                
                // Post to Bluesky if enabled
                if (ENABLE_BLUESKY) {
                    try {
                        await postToBluesky(content);
                        console.log(`Posted to Bluesky: ${update.id}`);
                    } catch (error) {
                        console.error('Error posting to Bluesky:', error.message);
                    }
                }
            }
            console.log("Updating:", updates[updates.length - 1].idNumber);
        }
    } catch (error) {
        console.error('Error in main process:', error.message);
    }
}

main();