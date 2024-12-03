const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const admin = require('firebase-admin');

const token = '7179708863:AAFpSyx5xhXv0rIVZgOPscWqrk5RLHiWDi0';
const kitsuBaseUrl = 'https://kitsu.io/api/edge/anime';
const serviceAccount = require('C:/Users/ramke/Desktop/fullstack/anime-bot-d3c8f-firebase-adminsdk-5y4j9-8ad2fe1175.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/anime (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const animeName = match[1];

  try {
    const response = await axios.get(`${kitsuBaseUrl}?filter[text]=${animeName}`);
    const animeData = response.data.data[0];
    const title = animeData.attributes.titles.en || animeData.attributes.titles.en_jp || 'N/A';
    const synopsis = animeData.attributes.synopsis || 'N/A';
    const rating = animeData.attributes.averageRating || 'N/A';

    // Save anime details to Firestore
    await db.collection('animeDetails').add({
      title: title,
      rating: rating,
      synopsis: synopsis,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send anime details to the user
    bot.sendMessage(chatId, `Title: ${title}\nRating: ${rating}\nSynopsis: ${synopsis}`);
  } catch (error) {
    // Handle errors
    console.error('Error fetching anime details:', error.message);
    bot.sendMessage(chatId, 'Error fetching anime details. Please try again later.');
  }
});

// Welcome message
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to AnimeBot! Send /anime followed by the name of the anime to get details.');
});
