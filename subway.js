const fs = require('fs').promises;
const axios = require('axios');
const env =      require('dotenv').config();

const JSON_URL = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json";

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

    return data.entity
        .filter(entity => {
            
            const hasAlert = 'alert' in entity;
            
            let alertType = 'unknown';
            if (hasAlert && entity.alert["transit_realtime.mercury_alert"]) {
                alertType = entity.alert["transit_realtime.mercury_alert"].alert_type;
            }

            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).getTime();
            const updatedAt = (entity.alert["transit_realtime.mercury_alert"].updated_at)*1000;
            const shouldInclude = hasAlert && alertType === 'Delays' && updatedAt > fiveMinutesAgo;
            
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
        //idNumber: extractIdNumber(entity.id),
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

// Main function that orchestrates the alert checking process
async function getAlerts() {
    try {
        console.log('Json URL:', JSON_URL);
        const newData = await fetchData(JSON_URL);
        return processNewAlerts(newData
            // , lastProcessedId
        );
    } catch (error) {
        console.error('Error in getAlerts:', error.message);
        return [];
    }
}

module.exports = { getAlerts };