const fs = require('fs').promises;
const axios = require('axios');
const env =      require('dotenv').config();

const JSON_URL = process.env.JSON_URL;
const ID_FILE = 'last_processed_id.txt';

// Extracts the numeric part of the alert ID
function extractIdNumber(id) {
    if (!id || typeof id !== 'string') return 0;
    const parts = id.split(':');
    return parts.length > 2 ? parseInt(parts[2], 10) || 0 : 0;
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
    if (!entity || !entity.alert) {
        console.log('Invalid entity structure:', JSON.stringify(entity));
        return null;
    }

    const alert = entity.alert;
    const mercuryAlert = alert["transit_realtime.mercury_alert"] || {};

    // Helper function to safely access text from translation array
    const safeTranslation = (textObj) => {
        if (!textObj) return '';
        if (!Array.isArray(textObj.translation) || textObj.translation.length === 0) return '';
        return textObj.translation[0].text || '';
    };

    // Log the presence or absence of header_text and description_text
    console.log('Entity ID:', entity.id);
    console.log('Has header_text:', 'header_text' in alert);
    console.log('Has description_text:', 'description_text' in alert);

    return {
        id: entity.id || 'Unknown ID',
        idNumber: extractIdNumber(entity.id),
        header: alert.header_text ? safeTranslation(alert.header_text) : 'No header',
        description: alert.description_text ? safeTranslation(alert.description_text) : 'No description',
        createdAt: quickTimestampToDate(mercuryAlert.created_at || 0),
        updatedAt: quickTimestampToDate(mercuryAlert.updated_at || 0),
        alertType: mercuryAlert.alert_type || alert.alert_type || 'Unknown'
    };
}

function quickTimestampToDate(timestamp) {
    if (!timestamp) return 'Invalid Date';
    const date = new Date(timestamp * 1000);
    return `${date.getFullYear()}-${
        String(date.getMonth() + 1).padStart(2, '0')}-${
        String(date.getDate()).padStart(2, '0')} ${
        String(date.getHours()).padStart(2, '0')}:${
        String(date.getMinutes()).padStart(2, '0')}:${
        String(date.getSeconds()).padStart(2, '0')}`;
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
