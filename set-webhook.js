// set-webhook.js
const axios = require('axios');

const BOT_TOKEN = 'your_bot_token';
const FUNCTION_ENDPOINT = 'https://cloud.appwrite.io/v1/functions/YOUR_FUNCTION_ID/executions';

async function setWebhook() {
    try {
        const response = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
            {
                url: FUNCTION_ENDPOINT
            }
        );
        
        console.log('✅ Webhook تنظیم شد:', response.data);
    } catch (error) {
        console.error('❌ خطا در تنظیم webhook:', error.response.data);
    }
}

setWebhook();
