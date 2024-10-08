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
    return response.data;
}

// Processes new delay alerts
function processNewAlerts(data, lastProcessedId) {
    return data.entity
        .filter(entity => 'alert' in entity && 
                          entity.alert.alert_type === 'DELAYS' && 
                          extractIdNumber(entity.id) > lastProcessedId)
        .map(processEntity);
}

// Extracts relevant information from a single entity
function processEntity(entity) {
    return {
        id: entity.id,
        idNumber: extractIdNumber(entity.id),
        header: entity.alert.header_text.translation[0].text,
        description: entity.alert.description_text.translation[0].text
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