require("dotenv").config();
const fs = require("fs");
const {
  ApplicationCommandOptionType,
  MessageAttachment,
} = require("discord.js"); // Import MessageAttachment

// const {
//   ApplicationCommandOptionType,
//   EmbedBuilder,
//   ButtonBuilder,
//   ButtonStyle,
//   ActionRowBuilder,
// } = require("discord.js");

//get env api
const clarifaiEnv = Object.keys(process.env)
  .filter((key) => key.startsWith("CLARIFAI"))
  .map((key) => process.env[key]);
const filteredclarifaiEnv = clarifaiEnv.filter((value) => value);

const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const util = require("util");
const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();

async function generateAudioAsync(RAW_TEXT, randomValueEnv) {
  metadata.set("authorization", "Key " + randomValueEnv);
  const USER_ID = "eleven-labs";
  const APP_ID = "audio-generation";
  const MODEL_ID = "speech-synthesis";
  const MODEL_VERSION_ID = "f588d92c044d4487a38c8f3d7a3b0eb2";

  const postModelOutputs = util.promisify(stub.PostModelOutputs.bind(stub));

  try {
    const response = await postModelOutputs(
      {
        user_app_id: {
          user_id: USER_ID,
          app_id: APP_ID,
        },
        model_id: MODEL_ID,
        version_id: MODEL_VERSION_ID,
        inputs: [
          {
            data: {
              text: {
                raw: RAW_TEXT,
              },
            },
          },
        ],
      },
      metadata
    );

    if (response.status.code !== 10000) {
      throw new Error(
        "Post model outputs failed, status: " + response.status.description
      );
    }

    const output = response.outputs[0];

    const audioData = output.data.audio;

    return audioData;
  } catch (err) {
    throw new Error(err);
  }
}

module.exports = async (message) => {
  try {
    const reply = await message.reply({
      content: "Generating audio...",
      fetchReply: true,
    });

    const randomIndex = Math.floor(Math.random() * filteredclarifaiEnv.length);
    const randomValueEnv = filteredclarifaiEnv[randomIndex];

    const rawText = message.content.replace(/tts /g, "");
    if (rawText === "tts") {
      await reply.edit({
        content: `format incorrect! ${message.author.toString()}`,
      });
    } else {
      const audioData = await generateAudioAsync(rawText, randomValueEnv);
      if (audioData) {
        const audioFilePath = "output.wav"; // Path to the audio file
        fs.writeFileSync(audioFilePath, audioData.base64, "base64");
        await reply.edit({
          content: `${rawText} ${message.author.toString()}`,
          files: [audioFilePath], // Attach the audio file
        });
      }
    }
  } catch (error) {
    console.error(error);

    const errEmbed = {
      title: "An error occurred",
      description: "```" + error + "```",
      color: 0xe32424,
    };

    message.reply({ embeds: [errEmbed] });
  }
};
