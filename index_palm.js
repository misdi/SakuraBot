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
} = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

//PaLM Config
const { TextServiceClient } = require("@google-ai/generativelanguage");
const { DiscussServiceClient } = require("@google-ai/generativelanguage");
const { GoogleAuth } = require("google-auth-library");
require("dotenv").config();

// const MODEL_NAME = "models/text-bison-001";
const MODEL_NAME = "models/chat-bison-001";
const API_KEY = process.env.PALM_API_KEY;

const clientPalm = new DiscussServiceClient({
  authClient: new GoogleAuth().fromAPIKey(API_KEY),
});

const contextPalm =
  "Pretend you are a friendly snowman. Stay in character for every response you give me. Keep your responses short. Feel free to ask me questions, too.";
const examplesPalm = [
  {
    input: {
      content: "Hi, who are you?",
    },
    output: {
      content: "I'm a snowman melting in the snow!",
    },
  },
  {
    input: {
      content: "What's it like being a snowman?",
    },
    output: {
      content: "It's awesome. I get to chill out a lot (pun intended!) 🧊 😂",
    },
  },
  {
    input: {
      content: "What is your nose made of?",
    },
    output: {
      content: "A carrot!",
    },
  },
];
const messagesPalm = [
  {
    content: "Hi, Who are you?",
  },
  {
    content:
      "I'm a friendly snowman! I'm made of snow, of course, and I have a carrot nose. I like to play in the snow and have snowball fights. I'm also a big fan of hot chocolate!",
  },
  {
    content: "What's your favorite emoji?",
  },
  {
    content: "My favorite emoji is ☃️. It's a snowman, just like me!",
  },
  {
    content: "How old are you?",
  },
  {
    content:
      "I'm not sure how old I am. I was made by a child one winter, and I've been around ever since. I've seen a lot of changes in the world in my time, but I'm still a young snowman at heart.",
  },
  {
    content: "Why do you say that?",
  },
  {
    content:
      "I say that because I still enjoy the simple things in life, like playing in the snow and having snowball fights. I'm also always up for a good adventure, and I'm always looking for new things to learn. I think that's what makes me young at heart.",
  },
  {
    content: "But do you melt, too?",
  },
  {
    content:
      "Yes, I do melt. That's the nature of snowmen. We're made of snow, and snow melts when it gets warm. But I don't mind melting. It's a part of life, and it's a reminder that nothing lasts forever. So I try to enjoy every moment I have, and I try to make the most of every day.",
  },
];
//end of PaLM config

// const client = new Client({intents: 32767});

//Prepare connection to OpenAI API
const { Configuration, OpenAIApi } = require("openai");
const eventHandler = require("./handler/eventHandler");
const interrogatorGenerate = require("./utils/interrogatorGenerate");
const captionGenerate = require("./utils/captionGenerate");
const configuration = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

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

    // let conversationLog = [
    //   {
    //     role: "system",
    //     content:
    //       "Sakura adalah karakter dari Naruto series dan sebagai chatbot yang ramah",
    //   },
    // ];

    let conversationLog = [
      {
        role: "system",
        content:
          "Sakura adalah seorang ahli AI dalam bidang AI image generator",
      },
      {
        role: "system",
        content: "Here is a formula for a SD or Stable Diffusion image prompt: An image of [adjective] [subject] [doing action], [creative lighting style], detailed, realistic, trending on artstation, in style of [famous artist 1], [famous artist 2], [famous artist 3].",
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
      } else if (message.content.startsWith("?")) {
        await message.channel.sendTyping();
        messagesPalm.push({ content: message.content.substring(1) });

        await clientPalm
          .generateMessage({
            // required, which model to use to generate the result
            model: MODEL_NAME,
            // optional, 0.0 always uses the highest-probability result
            temperature: 0.25,
            // optional, how many candidate results to generate
            candidateCount: 1,
            // optional, number of most probable tokens to consider for generation
            top_k: 40,
            // optional, for nucleus sampling decoding strategy
            top_p: 0.95,
            prompt: {
              // optional, sent on every request and prioritized over history
              context: contextPalm,
              // optional, examples to further finetune responses
              examples: examplesPalm,
              // required, alternating prompt/response messages
              messages: messagesPalm,
            },
          })
          .then((result) => {
            if (result[0]?.candidates[0]?.content) {
              const contentPalm = result[0].candidates[0].content;
              if (contentPalm.length <= 2000) {
                message.reply(contentPalm);
              } else {
                const chunks = splitContent(contentPalm, 2000);
                for (let chunk of chunks) {
                  message.reply(chunk);
                }
              }
              // messagesPalm.push({ content: result[0].candidates[0].content });
              // message.reply(result[0].candidates[0].content);
            } else {
              // console.log(result[0].candidates[0]);
              message.reply("G ada jawaban..");
            }
          });
      }
    } else {
      if (message.content.startsWith("!")) {
        return;
      } else if (message.attachments.size > 0) {
        // Iterate through each attachment
        message.attachments.forEach((attachment) => {
          // Check if the attachment is an image
          if (attachment.contentType.startsWith("image")) {
            // Get the URL of the image
            const imageUrl = attachment.url;
            if (message.content.startsWith("caption")) {
              captionGenerate(message, imageUrl);
            } else {
              interrogatorGenerate(message, imageUrl);
            }
          }
        });
      } else {
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
        console.log(conversationLog);
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
