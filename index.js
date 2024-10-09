const { getAlerts } = require('./subway');
const { postToThreads } = require('./threads');
const fs = require('fs').promises;

//const ID_FILE = 'last_processed_id.txt';

// Writes last processed ID number to file
// async function updateLastProcessedId(id) {
//     await fs.writeFile(ID_FILE, id.toString());
// }

async function main() {
    try {
        const updates = await getAlerts();
        console.log('Number of new alerts:', updates.length);
        
        if (updates.length > 0) {
            for (const update of updates) {
                const content = `${update.header}`;
                await postToThreads(content);
                console.log(`Posted update for alert: ${update.id}`);
            }
            console.log("Updating:", updates[updates.length - 1].idNumber);
            //await updateLastProcessedId(updates[updates.length - 1].idNumber);
        }
    } catch (error) {
        console.error('Error in main process:', error.message);
    }
}

main();