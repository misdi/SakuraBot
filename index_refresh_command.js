//create discord bot using openai api that interact on the discord server
require("dotenv").config();

const { CommandHandler } = require("djs-commander");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { saveImageAndText } = require("./saveImageAndText");

//Prepare to connect to the Discord API
const {
  Client,
  Events,
  GatewayIntentBits,
  ApplicationCommandOptionType,
  EmbedBuilder,
  MessageEmbed,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  REST,
  Routes,
} = require("discord.js");
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
const eventHandler = require("./handler/eventHandler");
const configuration = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);






const rest = new REST().setToken(process.env.DISCORD_TOKEN);
// for global commands
rest.put(Routes.applicationCommands("1116172108695883788"), { body: [] })
	.then(() => console.log('Successfully deleted all application commands.'))
	.catch(console.error);




new CommandHandler({
  client, // Discord.js client object | Required by default
  commandsPath: path.join(__dirname, "commands"), // The commands directory
  eventsPath: path.join(__dirname, "events"), // The events directory
  // validationsPath: path.join(__dirname, 'validations'), // Only works if commandsPath is provided
  // testServer: '', // To register guild-based commands (if it's not provided commands will be registered globally)
});

eventHandler(client);

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return; // Ignore reactions from bots

  // Check if the reaction is on a message with the ✉️ emoji
  if (reaction.emoji.name === "✉️") {
    const message = reaction.message;
    const attachments = message.attachments;
    const textContent = message.content;
    const textEmbed = message.embeds;
    const originalMessageLink = message.url;
    if (attachments.size > 0) {
      attachments.forEach(async (attachment) => {
        try {
          const downloadLink = attachment.url;

          const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("Download")
              .setStyle(ButtonStyle.Link)
              .setURL(downloadLink)
              .setEmoji("1101133529607327764"),
            new ButtonBuilder()
              .setLabel("Original Message")
              .setStyle(ButtonStyle.Link)
              .setURL(originalMessageLink)
          );

          const resultEmbed = new EmbedBuilder().setColor("#44a3e3");

          if (textContent) {
            resultEmbed.setDescription(textContent);
          } else {
            resultEmbed.setDescription("📌");
          }

          if (textEmbed.length > 0) {
            if (textEmbed[0].data.image)
              resultEmbed.setImage(textEmbed[0].data.image.url);
            if (textEmbed[0].data.title)
              resultEmbed.setTitle(textEmbed[0].data.title);
            if (textEmbed[0].data.fields)
              resultEmbed.addFields(textEmbed[0].data.fields);
            if (textEmbed[0].data.footer)
              resultEmbed.setFooter(textEmbed[0].data.footer);
          }

          resultEmbed.setImage(downloadLink);

          await user.send({
            content: textContent,
            embeds: [resultEmbed],
            components: [buttonRow],
          });
        } catch (error) {
          console.error("Failed to send download link:", error);
        }
      });
    } else {
      // Send only the text content in an embed with the "Original Message" button
      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Original Message")
          .setStyle(ButtonStyle.Link)
          .setURL(originalMessageLink)
      );

      const resultEmbed = new EmbedBuilder().setColor("#44a3e3");

      if (textContent) {
        resultEmbed.setDescription(textContent);
      } else {
        resultEmbed.setDescription("📌");
      }

      if (textEmbed.length > 0) {
        if (textEmbed.length > 0) {
          if (textEmbed[0].data.image)
            resultEmbed.setImage(textEmbed[0].data.image.url);
          if (textEmbed[0].data.title)
            resultEmbed.setTitle(textEmbed[0].data.title);
          if (textEmbed[0].data.fields)
            resultEmbed.addFields(textEmbed[0].data.fields);
          if (textEmbed[0].data.footer)
            resultEmbed.setFooter(textEmbed[0].data.footer);
        }
      }

      await user.send({
        embeds: [resultEmbed],
        components: [buttonRow],
      });
    }
  }
});

client.on("messageCreate", async function (message) {
  try {
    //start for saving the images : work for MJ bot only id : 936929561302675456
    if (message.author.id === "936929561302675456") {
      if (
        (message.attachments.size > 0 && message.content) ||
        message.attachments.size > 1
      ) {
        saveImageAndText(message);
      }
    }
    //end of saving images.

    if (message.author.bot) return;

    let conversationLog = [
      {
        role: "system",
        content:
          "Sakura adalah karakter dari Naruto series dan sebagai chatbot yang ramah",
      },
    ];

    if (
      message.channel.id !== process.env.CHANNEL_ID_REMIX_ID &&
      message.channel.id !== process.env.CHANNEL_ID_AI_INDONESIA
    ) {
      if (message.content.startsWith("!")) {
        await message.channel.sendTyping();
        let prevMessages = await message.channel.messages.fetch({ limit: 15 });
        prevMessages.reverse();
        prevMessages.forEach((msg) => {
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

        const content = result.data.choices[0].message.content;
        if (content.length <= 2000) {
          // If content is within the limit, send it normally
          message.reply(content);
        } else {
          // Split the content into smaller chunks and send them separately
          const chunks = splitContent(content, 2000);
          for (let chunk of chunks) {
            message.reply(chunk);
          }
        }
      }
    } else {
      if (message.content.startsWith("!")) return;
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

      const content = result.data.choices[0].message.content;
      if (content.length <= 2000) {
        // If content is within the limit, send it normally
        message.reply(content);
      } else {
        // Split the content into smaller chunks and send them separately
        const chunks = splitContent(content, 2000);
        for (let chunk of chunks) {
          message.reply(chunk);
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
});

// Function to split the content into smaller chunks
function splitContent(content, maxLength) {
  const chunks = [];
  let currentChunk = "";
  const words = content.split(" ");

  for (let word of words) {
    if (currentChunk.length + word.length + 1 <= maxLength) {
      // Add word to the current chunk
      currentChunk += " " + word;
    } else {
      // Push the current chunk to the list of chunks
      chunks.push(currentChunk.trim());
      // Start a new chunk with the current word
      currentChunk = word;
    }
  }

  // Push the last chunk to the list of chunks
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}



client.login(process.env.DISCORD_TOKEN);
