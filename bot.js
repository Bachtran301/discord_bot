const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const keep_alive = require('./keep_alive.js')
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;

let db;

// Connect to MongoDB
async function connectToMongoDB() {
    const mongoClient = new MongoClient(MONGO_URI);
    try {
        await mongoClient.connect();
        db = mongoClient.db('dinosaur-game'); // Replace with your database name
        console.log('Connected to MongoDB');
        console.log('Database name:', db.databaseName);

        // Check the number of documents in the collection
        const count = await db.collection('scores').countDocuments();
        console.log('Number of documents in scores:', count);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

// Fetch high scores from MongoDB
async function fetchHighScores() {
    try {
        const scoresCollection = db.collection('scores');
        const scores = await scoresCollection.find().sort({ score: -1 }).limit(5).toArray();
        console.log('High score data:', JSON.stringify(scores));
        return scores;
    } catch (error) {
        console.error('Error fetching high scores:', error);
        return null;
    }
}

// Create leaderboard embed
function createLeaderboardEmbed(scores) {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Top 5 Highest Scores')
        .setTimestamp();

    if (!scores || scores.length === 0) {
        embed.setDescription('No high score data available!');
    } else {
        let description = '';
        scores.forEach((score, index) => {
            description += `${index + 1}. ${score.player_name}: ${score.score}\n`;
        });
        embed.setDescription(description);
    }

    return embed;
}

client.once('ready', async () => {
    await connectToMongoDB();
    console.log('Bot is ready!');
});

client.on('messageCreate', async (message) => {
    if (message.content === '!leaderboard') {
        try {
            console.log('Received leaderboard command');
            const scores = await fetchHighScores();
            console.log('Scores fetched:', scores);
            if (scores && scores.length > 0) {
                const embed = createLeaderboardEmbed(scores);
                await message.channel.send({ embeds: [embed] });
            } else {
                await message.channel.send('No high score data available or unable to fetch data. Please try again later.');
            }
        } catch (error) {
            console.error('Error processing leaderboard command:', error);
            await message.channel.send('An error occurred while processing the command. Please try again later.');
        }
    }
});

client.login(TOKEN).catch(error => {
    console.error('Error logging in bot:', error);
});

// Handle unhandled rejections
process.on('unhandledRejection', error => {
    console.error('Unhandled rejection:', error);
});
//helloworld