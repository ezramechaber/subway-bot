const { getAlerts } = require('./subway');
const { postToThreads } = require('./threads');
const fs = require('fs').promises;

async function main() {
    try {
        const updates = await getAlerts();
        console.log('Number of new alerts:', updates.length);
        
        if (updates.length > 0) {
            for (const update of updates) {
                const content = `${update.header}`;
                console.log(`Posted update for alert: ${update.id}`);
            }
            console.log("Updating:", updates[updates.length - 1].idNumber);
        }
    } catch (error) {
        console.error('Error in main process:', error.message);
    }
}

main();