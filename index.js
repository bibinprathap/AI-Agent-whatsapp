const wa = require('@open-wa/wa-automate');
const axios = require('axios');
const chromePaths = require('chrome-paths');


const whitelistedNumbers = [

  '971569245365@c.us'  
];

wa.create({
  sessionId: "COVID_HELPER",
  multiDevice: true,
  authTimeout: 60,
  blockCrashLogs: true,
  disableSpins: true,
  headless: false, // Set to true after it works
  executablePath: chromePaths.chrome || 
                 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  hostNotificationLang: 'PT_BR',
  logConsole: false,
  popup: true,
  qrTimeout: 0,
  puppeteerOptions: { 
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" // Let puppeteer find or download Chrome
  }
}).then(client => start(client));

function start(client) {
  
  client.onMessage(async message => {
    console.log('Message received:', message.body);
    console.log('Sender:', message.from);

    
    if (isNumberWhitelisted(message.from)) {
      console.log('Authorized number.');

      if (message.body === 'Hi') {
        await client.sendText(message.from, '👋 Hello! How can I help you today?');
        console.log('Response sent: 👋 Hello!');
      } else { 
        const question = message.body;
    
        try {
          const response = await axios.post( "https://flow.spaceaiapp.com/api/v1/prediction/816d4fe3-239c-4e3c-94fb-a81f9f460112", {
            question: question
          }, {
            headers:    { "Content-Type": "application/json" },
          });

          const formattedAnswer = formatResponse(response.data);
          await client.sendText(message.from, formattedAnswer);
          console.log('Formatted response sent.', answer);
        } catch (error) {
          console.error('API request error:', error);
          await client.sendText(message.from, 'Sorry, there was an error processing your request');
          console.log('Please try again later or rephrase your question.');
        }
      }
    } else {
      console.log('Unauthorized number.');
      await client.sendText(message.from, ' Access Denied, You are not authorized to interact with this chatbot.');
      console.log('Please contact the administrator for access.');
    }
  });
}

function isNumberWhitelisted(number) { 
  return whitelistedNumbers.some(whitelistedNumber => whitelistedNumber === number);
}
function formatResponse(apiResponse) {
  try {
    // If the response is already an object with text property
    if (apiResponse.text) {
      // Clean up the text formatting
      let formattedText = apiResponse.text
        .replace(/\.\s+/g, '.\n') // Add line breaks after periods
        .replace(/\n\s*\n/g, '\n\n') // Remove extra empty lines
        .replace(/\*\*(.*?)\*\*/g, '*$1*') // Convert markdown bold to WhatsApp bold
        .replace(/## (.*?)\n/g, '*$1*\n') // Convert headings to bold
        .replace(/- /g, '• ') // Convert dashes to bullets
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1: $2'); // Convert markdown links

      // Add header and footer
      return `ℹ️ *Response*:\n\n${formattedText}\n\n` +
             `_This is an automated response. Contact the administrator for more information._`;
    }
    
    // If it's a simple string response
    return apiResponse.toString()
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
      
  } catch (e) {
    console.error('Error formatting response:', e);
    return apiResponse; // Return original if formatting fails
  }
}