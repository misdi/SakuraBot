require("dotenv").config();

const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

//get env api
const clarifaiEnv = Object.keys(process.env)
  .filter((key) => key.startsWith("CLARIFAI"))
  .map((key) => process.env[key]);
const filteredclarifaiEnv = clarifaiEnv.filter((value) => value);
// const randomIndex = Math.floor(Math.random() * filteredclarifaiEnv.length);
// const randomValueEnv = filteredclarifaiEnv[randomIndex];

const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const util = require("util");
const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();

const checkingNsfw = async (IMAGE_URL, randomValueEnv) => {
  metadata.set("authorization", "Key " + randomValueEnv);
  const USER_ID = "clarifai";
  const APP_ID = "main";
  // Change these to whatever model and image URL you want to use
  const MODEL_ID = "nsfw-recognition";
  const MODEL_VERSION_ID = "aa47919c9a8d4d94bfa283121281bcc4";

  const postModelOutputs = util.promisify(stub.PostModelOutputs.bind(stub));

  try {
    const response = await postModelOutputs(
      {
        user_app_id: {
          user_id: USER_ID,
          app_id: APP_ID,
        },
        model_id: MODEL_ID,
        version_id: MODEL_VERSION_ID, // This is optional. Defaults to the latest model version
        inputs: [
          { data: { image: { url: IMAGE_URL, allow_duplicate_url: true } } },
        ],
      },
      metadata
    );

    if (response.status.code !== 10000) {
      throw new Error(
        "Post model outputs failed, status: " + response.status.description
      );
    }

    // Since we have one input, one output will exist here
    const output = response.outputs[0];
    const predictedConcepts = output.data.concepts.map((concept) => ({
      name: concept.name,
      value: concept.value,
    }));

    console.log(predictedConcepts);
    return predictedConcepts;
  } catch (err) {
    throw new Error(err);
  }
};

// function isNsfwHigherValue(statusNsfw) {
//   const nsfwValue = statusNsfw.find((item) => item.name === "nsfw");
//   const sfwValue = statusNsfw.find((item) => item.name === "sfw");

//   if (nsfwValue && sfwValue) {
//     return nsfwValue.value > sfwValue.value;
//   }

//   return false; // Return false if either 'nsfw' or 'sfw' is not found.
// }

function isNsfwHigherValue(statusNsfw) {
    const nsfwValue = statusNsfw.find((item) => item.name === "nsfw");
  
    if (nsfwValue && nsfwValue.value >= 0.60) {
      return true;
    }
  
    return false;
  }
  

const cuteEmojis = [
    "😊",
    "🥰",
    "😻",
    "💖",
    "🌸",
    "🐾",
    "🌼",
    "🍭",
    "🎈",
    "🥇",
    "❤️",
  ];

  // Function to get a random cute emoji
  function getRandomCuteEmoji() {
    const randomIndex = Math.floor(Math.random() * cuteEmojis.length);
    return cuteEmojis[randomIndex];
  }

module.exports = async (message, image_url_input) => {
  try {
    const randomIndex = Math.floor(Math.random() * filteredclarifaiEnv.length);
    const randomValueEnv = filteredclarifaiEnv[randomIndex];

    let finalStatusNsfw = false;
    try {
      const statusNsfw = await checkingNsfw(image_url_input, randomValueEnv);
      const isNsfwHigher = isNsfwHigherValue(statusNsfw);
      if (isNsfwHigher) {
        // message.delete();
        finalStatusNsfw = true;
      } else {
        // finalStatusNsfw = false;
        message.react(getRandomCuteEmoji());
        message.react(getRandomCuteEmoji());
      }
      return finalStatusNsfw;
    } catch (error) {
      message.react("🤔");
    }
  } catch (error) {
    message.react("🤔");
  }
};
