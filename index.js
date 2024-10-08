const fs = require('fs').promises;
const axios = require('axios');
const env =      require('dotenv').config();

const JSON_URL = process.env.JSON_URL;
const ID_FILE = 'last_processed_id.txt';

// Extracts the numeric part of the alert ID
function extractIdNumber(id) {
    return parseInt(id.split(':')[2]);
}

// Reads last processed ID number from file
async function readLastProcessedId() {
    try {
        const data = await fs.readFile(ID_FILE, 'utf8');
        return parseInt(data.trim());
    } catch (error) {
        console.log('No existing processed ID found. Starting from the beginning.');
        return 0;
    }
}

// Writes last processed ID number to file
async function writeLastProcessedId(id) {
    await fs.writeFile(ID_FILE, id.toString());
}

// Fetches JSON data from the specified URL
async function fetchData(url) {
    const response = await axios.get(url);
    const date = new Date(response.data.header.timestamp * 1000);
    console.log('Timestamp:', date.toString());
    
    console.log('Number of entities:', response.data.entity.length);
    return response.data;
}

// Processes new delay alerts
function processNewAlerts(data, lastProcessedId) {
    if (!data.entity || !Array.isArray(data.entity)) {
        console.error('Unexpected data structure: entity array not found');
        return [];
    }

    // console.log('Number of entities:', data.entity.length);

    return data.entity
        .filter(entity => {
            // console.log('Processing entity:', entity.id);
            
            const hasAlert = 'alert' in entity;
            // console.log('Has alert:', hasAlert);
            
            let alertType = 'unknown';
            if (hasAlert && entity.alert["transit_realtime.mercury_alert"]) {
                alertType = entity.alert["transit_realtime.mercury_alert"].alert_type;
            }
            // console.log('Alert type:', alertType);
            
            const idNumber = extractIdNumber(entity.id);
            // console.log('ID number:', idNumber, 'Last processed ID:', lastProcessedId);
            
            const shouldInclude = hasAlert && alertType === 'Delays' && idNumber > lastProcessedId;
            // console.log('Should include this alert:', shouldInclude);
            // console.log('---');
            
            return shouldInclude;
        })
        .map(processEntity);
}

// Extracts relevant information from a single entity
function processEntity(entity) {
   console.log('Processing entity:', entity.id);
    return {
        id: entity.id || 'N/A',
        idNumber: extractIdNumber(entity.id) || 'N/A',
        header: entity.alert.header_text.translation[0].text || 'N/A',
        description: entity.alert.description_text.translation[0].text || 'N/A',
        createdAt: entity.alert["transit_realtime.mercury_alert"].created_at || 'N/A',
        updatedAt: entity.alert["transit_realtime.mercury_alert"].updated_at || 'N/A'
    };
}

// Updates the bot with new delay alert information
function updateBot(updates) {
    for (const update of updates) {
        console.log(`New delay alert: ${update.id}`);
        console.log(`Header: ${update.header}`);
        console.log(`Description: ${update.description}`);
        console.log('---');
    }
}

// Main function that orchestrates the alert checking and updating process
async function main() {
    try {
        const lastProcessedId = await readLastProcessedId();
        console.log ('Last processed ID:', lastProcessedId);
        console.log ('Json URL:',JSON_URL)
        const newData = await fetchData(JSON_URL);
        const updates = processNewAlerts(newData, lastProcessedId);

        console.log('Number of new alerts:', updates.length);
        if (updates.length > 0) {
            updateBot(updates);
            await writeLastProcessedId(updates[updates.length - 1].idNumber);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the main function once
main();
