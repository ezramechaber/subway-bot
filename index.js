const axios = require('axios');

const JSON_URL = process.env.JSON_URL;
let oldIds = new Set();

async function fetchData(url) {
    const response = await axios.get(url);
    return response.data;
}

function getAlertIds(data) {
    return new Set(data.entity.filter(entity => 'id' in entity).map(entity => entity.id));
}

function findNewAlerts(newIds, oldIds) {
    return new Set([...newIds].filter(id => !oldIds.has(id)));
}

function processNewAlerts(data, newIds) {
    return data.entity
        .filter(entity => newIds.has(entity.id))
        .map(processEntity)
        .filter(Boolean);
}

function processEntity(entity) {
    if ('alert' in entity) {
        return {
            id: entity.id,
            header: entity.alert.header_text.translation[0].text,
            description: entity.alert.description_text.translation[0].text
        };
    }
    return null;
}

function updateBot(updates) {
    for (const update of updates) {
        console.log(`New alert: ${update.id}`);
        console.log(`Header: ${update.header}`);
        console.log(`Description: ${update.description}`);
        console.log('---');
    }
}

async function main() {
    try {
        const newData = await fetchData(JSON_URL);
        const newIds = getAlertIds(newData);
        const newAlertIds = findNewAlerts(newIds, oldIds);
        
        if (newAlertIds.size > 0) {
            const updates = processNewAlerts(newData, newAlertIds);
            updateBot(updates);
        }
        
        oldIds = newIds;
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the main function every 5 minutes
setInterval(main, 5 * 60 * 1000);

// Run once immediately
main();