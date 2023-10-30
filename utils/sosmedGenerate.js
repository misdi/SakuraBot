require("dotenv").config();

const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_KEY,
});

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

const generateTaggingAsync = async (IMAGE_URL, randomValueEnv) => {
  metadata.set("authorization", "Key " + randomValueEnv);
  const USER_ID = "clarifai";
  const APP_ID = "main";
  // Change these to whatever model and image URL you want to use
  const MODEL_ID = "general-image-recognition";
  const MODEL_VERSION_ID = "aa7f35c01e0642fda5cf400f543e7c40";

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

    // console.log("Predicted concepts:");
    // for (const concept of predictedConcepts) {
    //   console.log(concept.name + " " + concept.value);
    // }
    // console.log("tagging suskes");
    return predictedConcepts;
  } catch (err) {
    // console.log("tagging gagal" + err);
    throw new Error(err);
  }
};

const generateCapton = async (IMAGE_URL, randomValueEnv) => {
  metadata.set("authorization", "Key " + randomValueEnv);
  const USER_ID = "salesforce";
  const APP_ID = "blip";
  const MODEL_ID = "general-english-image-caption-blip-2";
  const MODEL_VERSION_ID = "71cb98f572694e28a99fa8fa86aaa825";

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

    const output = response.outputs[0];
    const predictedConcepts = output.data.text.raw;
    // console.log("caption suskes");
    return predictedConcepts;
  } catch (err) {
    // console.log("caption gagal" + err);
    throw new Error(err);
    // const title = await generateCaptonv1(image_url_input, randomValueEnv);
    // return title;
  }
};

const generateCaptonv1 = async (IMAGE_URL, randomValueEnv) => {
  metadata.set("authorization", "Key " + randomValueEnv);
  const USER_ID = "salesforce";
  const APP_ID = "blip";
  const MODEL_ID = "general-english-image-caption-blip";
  const MODEL_VERSION_ID = "cdb690f13e62470ea6723642044f95e4";

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

    const output = response.outputs[0];
    const predictedConcepts = output.data.text.raw;
    // console.log("caption v1 suskes");
    return predictedConcepts;
  } catch (err) {
    // console.log("caption v1 gagal" + err);
    throw new Error(err);
    // return "caption error! : " + err;
  }
};

async function generateGPT4CompletionAsync(rawText, randomValueEnv) {
  metadata.set("authorization", "Key " + randomValueEnv);
  const USER_ID = "openai";
  const APP_ID = "chat-completion";
  const MODEL_ID = "GPT-4";
  const MODEL_VERSION_ID = "222980e6d13341a5a3d892e63dda1f9e";

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
                raw:
                  "make a description in English and Bahasa Indonesia for DeviantArt posting from this topic " +
                  rawText +
                  ". the output must be like this format. Description: ",
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
    const completionText = output.data.text.raw;
    // console.log("gpt suskes");
    return completionText;
  } catch (err) {
    // console.log("gpt gagal" + err);
    throw new Error(err);
  }
}

async function generateGPT4OpenAI(rawText) {
  try {
    const openai = new OpenAIApi(configuration);
    let conversationLog = [
      {
        role: "user",
        content:
          "make a description in English and Bahasa Indonesia for DeviantArt posting from this topic" +
          rawText +
          ". the output must be like this format. Description: ",
      },
    ];
    const result = await openai.createChatCompletion({
      model: "gpt-4",
      messages: conversationLog,
    });
    const content = result.data.choices[0].message.content;
    // console.log("sukses");
    return content;
  } catch (err) {
    // console.log("gpt openai gagal" + err);
    throw new Error(err);
  }
}

function parseOptions(message) {
  let desc = true;

  if (/\s+--nodesc/.test(message)) {
    desc = false;
  }

  return desc;
}

module.exports = async (message, image_url_input) => {
  try {
    const reply = await message.reply({
      content: "SosMed processing...",
      fetchReply: true,
    });

    let desc = parseOptions(message);

    const randomIndex = Math.floor(Math.random() * filteredclarifaiEnv.length);
    const randomValueEnv = filteredclarifaiEnv[randomIndex];

    // console.log(randomValueEnv);

    let tagging;
    let tagging_info;
    try {
      const textTagging = await generateTaggingAsync(
        image_url_input,
        randomValueEnv
      );
      tagging = textTagging.map((concept) => `${concept.name}`).join(", ");
      tagging_info = "✅Tagging successfully...";
      await reply.edit(`${tagging_info} \nCaption model 2 processing...`);
    } catch (error) {
      tagging = "Error!";
      tagging_info = "❌Tagging failed...";
      await reply.edit(`${tagging_info} \nCaption model 2 processing...`);
    }

    let title;
    let caption_info;
    try {
      title = await generateCapton(image_url_input, randomValueEnv);
      caption_info = "✅Caption model 2 successfully...";
      await reply.edit(
        `${tagging_info} \n${caption_info}\nDescription model 1 processing...`
      );
    } catch (error) {
      caption_info = "❌Caption model 2 failed..." + error;
      await reply.edit(
        `${tagging_info} \n${caption_info}\nCaption model 1 processing...`
      );
      try {
        caption_info = "✅Caption model 1 successfully...";
        title = await generateCaptonv1(image_url_input, randomValueEnv);
      } catch (erro) {
        caption_info = "❌Caption model 1 failed..." + erro;
        title = "Caption error!!";
        desc = false;
      }
    }

    const resultEmbed = new EmbedBuilder()
      .setTitle(`SosMed information`)
      .addFields({ name: "Caption", value: title })
      .setImage(image_url_input)
      .setColor("#44a3e3")
      .setFooter({
        text: `Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      });

    if (desc) {
      let completionText;
      try {
        completionText = await generateGPT4CompletionAsync(
          title,
          randomValueEnv
        );
        resultEmbed.addFields({ name: "Description", value: completionText });
      } catch (error) {
        await reply.edit(
          `${tagging_info} \n${caption_info}\n❌Description model 1 failed...${error}\nDescription model 2 processing...`
        );
        completionText = await generateGPT4OpenAI(title);
        resultEmbed.addFields({ name: "Description", value: completionText });
      }
    }

    resultEmbed.addFields({ name: "Tagging", value: tagging });

    await reply.edit(`SosMed successfully! ${message.author.toString()}`);
    await reply.edit({
      embeds: [resultEmbed],
    });
  } catch (error) {
    // console.log(error)
    const errEmbed = new EmbedBuilder()
      .setTitle("❌Error!!")
      .setDescription("```" + error + "```")
      .setColor(0xe32424);

    message.reply({ embeds: [errEmbed] });
  }
};
