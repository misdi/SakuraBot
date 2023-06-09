//create discord bot using openai api that interact on the discord server
require("dotenv").config();

//Prepare to connect to the Discord API
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// const client = new Client({intents: 32767});

//Prepare connection to OpenAI API
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

//check for when a message on discord is sent
client.on("ready", () => {
  console.log("Bot is online");
});



client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return; // Ignore reactions from bots
  
    // Check if the reaction is on a message with the ✉️ emoji
    if (reaction.emoji.name === '✉️') {
      const message = reaction.message;
      const attachments = message.attachments;
  
      // Check if there are any attachments
      if (attachments.size > 0) {
        // Loop through the attachments and send a download link to the user
        attachments.forEach(async (attachment) => {
          try {
            const downloadLink = attachment.url;
            await user.send(`Download link: ${downloadLink}`);
          } catch (error) {
            console.error('Failed to send download link:', error);
          }
        });
      }
    }



  });
  

client.on("messageCreate", async function (message) {
  try {
    if (message.author.bot) return;
    if (message.channel.id !== process.env.CHANNEL_ID_REMIX_ID && message.channel.id !== process.env.CHANNEL_ID_AI_INDONESIA) return;
    if (message.content.startsWith("!")) return;

    let conversationLog = [
      {
        role: "system",
        content:
          "Sakura adalah karakter dari Naruto series dan sebagai chatbot yang ramah",
      },
    ];

    await message.channel.sendTyping();

    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();
    prevMessages.forEach((msg) => {
      if (message.content.startsWith("!")) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;
      if (msg.author.id !== message.author.id) return;

      conversationLog.push({
        role: "user",
        content: msg.content,
      });
    });

    const result = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: conversationLog,
    });
    message.reply(result.data.choices[0].message);
  } catch (err) {
    console.log(err);
  }
});

client.login(process.env.DISCORD_TOKEN);
