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
            
            let fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            let mercuryAlert = entity.alert["transit_realtime.mercury_alert"];
            let alertType = mercuryAlert.alert_type;
            let updatedAt = mercuryAlert.updated_at * 1000;
            let alertText = entity.alert.header_text.translation[0].text;
            
            if (alertType === 'Delays') {
                console.log('Delay Alert Details:', {
                    id: entity.id,
                    alertType,
                    updatedAt: updatedAt,
                    fiveMinutesAgo: fiveMinutesAgo,
                    alertText: alertText,
                    isRecent: updatedAt > fiveMinutesAgo
                })

                return updatedAt > fiveMinutesAgo;
            };
        return false;
        })
        .map(processEntity);
}

// Modify alert text when called
function categorizeSubwayAlert(alertText) {
    const categories = [
      { emoji: '👮', keywords: ['NYPD', 'police', 'investigation'] },
      { emoji: '🚦', keywords: ['signal', 'switch'] },
      { emoji: '🚪', keywords: ['door'] },
      { emoji: '⚙️', keywords: ['mechanical', 'brakes'] },
      { emoji: '🏥', keywords: ['medical', 'EMS'] },
      { emoji: '🚢', keywords: ['bridge'] },
      { emoji: '🛤️', keywords: ['rails', 'replaced rails'] },
      { emoji: '🚶', keywords: ['person', 'disruptive'] },
      { emoji: '🗑️', keywords: ['debris'] },
      { emoji: '🔀', keywords: ['express', 'local'] }
    ];
  
    const lowerCaseAlert = alertText.toLowerCase();
    
    for (const category of categories) {
      if (category.keywords.some(keyword => lowerCaseAlert.includes(keyword))) {
        return `${category.emoji} ${alertText}`;
      }
    }
  
    // Default category for unspecified delays
    return `⚠️ ${alertText}`;
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
        header: categorizeSubwayAlert(alert.header_text ? safeTranslation(alert.header_text) : 'No header'),
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
        return processNewAlerts(newData);
    } catch (error) {
        console.error('Error in getAlerts:', error.message);
        return [];
    }
}

module.exports = { getAlerts };