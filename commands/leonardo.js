require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const models = require("../models_leonardo");
const sdk = require("api")("@leonardoai/v1.0#28807z41owlgnis8jg");

async function saveImage(url, username, generationData) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const contentDisposition = response.headers["content-disposition"];
    const fileName = contentDisposition
      ? contentDisposition.match(/filename="?(.+?)"?$/)[1]
      : path.basename(url);

    const parentFolderPath = path.join(__dirname, "..", "generated");
    const userFolderPath = path.join(parentFolderPath, username);

    if (!fs.existsSync(parentFolderPath)) {
      fs.mkdirSync(parentFolderPath, { recursive: true });
    }

    if (!fs.existsSync(userFolderPath)) {
      fs.mkdirSync(userFolderPath, { recursive: true });
    }

    let newFileName = fileName;
    let count = 1;
    const fileExt = path.extname(fileName);
    const baseFileName = path.basename(fileName, fileExt);

    while (fs.existsSync(path.join(userFolderPath, newFileName))) {
      newFileName = `${baseFileName}_${count}${fileExt}`;
      count++;
    }

    const filePath = path.join(userFolderPath, newFileName);

    fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

    // Save generation info in a text file
    let infoFileName = `${baseFileName}.txt`;
    count = 1;

    while (fs.existsSync(path.join(userFolderPath, infoFileName))) {
      infoFileName = `${baseFileName}_${count}.txt`;
      count++;
    }

    const infoFilePath = path.join(userFolderPath, infoFileName);
    const generationInfo = JSON.stringify(generationData, null, 2);
    fs.writeFileSync(infoFilePath, generationInfo);

    return filePath;
  } catch (error) {
    console.error("Error saving image:", error);
    throw error;
  }
}

async function getGenerationById(id_data) {
  try {
    const { data } = await sdk.getGenerationById({ id: id_data });
    return data;
  } catch (err) {
    console.error(err);
  }
}
async function getUserSelf() {
  try {
    const { data } = await sdk.getUserSelf();
    return data;
  } catch (err) {
    console.error(err);
  }
}
async function createGeneration(
  prompt,
  negative_prompt,
  model,
  width,
  height,
  count
) {
  sdk.auth(process.env.LEONARDO_API_KEY);

  try {
    const { data } = await sdk.createGeneration({
      prompt: prompt,
      negative_prompt: negative_prompt,
      modelId: model,
      num_images: count,
      width: width || 640,
      height: height || 832,
      public: false,
      guidance_scale: 7,
      presetStyle: "LEONARDO",
    });
    const id_generations = data.sdGenerationJob.generationId;
    return id_generations;
  } catch (err) {
    await interaction.editReply({
      content:
        "The prompt you provided contains NSFW (Not Safe for Work) content. Please provide a different prompt.",
    });
    return;
  }
}

function parsePrompt(prompt) {
  let width = 640;
  let height = 832;

  const resMatch = prompt.match(/--res\s+(\d+):(\d+)/i);
  if (resMatch) {
    width = parseInt(resMatch[1]);
    height = parseInt(resMatch[2]);
    prompt = prompt.replace(resMatch[0], "").trim();
  }

  return { prompt, width, height };
}

function getModelNameByValue(modelValue) {
  for (const model of models) {
    if (model.value === modelValue) {
      return model.name;
    }
  }
  return "-"; // Return null if no model with the given value is found
}

module.exports = {
  run: async ({ interaction }) => {
    try {
      await interaction.deferReply();

      let prompt = interaction.options.getString("prompt");
      const negative_prompt = interaction.options.getString("negative_prompt");
      const model =
        interaction.options.getString("model_name") || models[0].value;
      let count = interaction.options.getInteger("count") || 1;
      count = Math.min(count, 4);
      const { prompt: parsedPrompt, width, height } = parsePrompt(prompt);
      prompt = parsedPrompt;

      const id_generation = await createGeneration(
        prompt,
        negative_prompt,
        model,
        width,
        height,
        count
      );
      const userData = await getUserSelf();
      const initialTokens = userData.user_details[0].subscriptionTokens;

      const waitTime = count === 3 ? 30000 : count === 4 ? 50000 : 20000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      const generationData = await getGenerationById(id_generation);
      const generatedImages = generationData.generations_by_pk.generated_images;
      const imageUrls = generatedImages.map((image) => image.url);

      const updatedUserData = await getUserSelf();
      const updatedTokens = updatedUserData.user_details[0].subscriptionTokens;

      const tokensUsed = initialTokens - updatedTokens;

      const savedImagePaths = [];
      for (const imageUrl of imageUrls) {
        const savedImagePath = await saveImage(
          imageUrl,
          interaction.user.username,
          generationData
        );
        savedImagePaths.push(savedImagePath);
      }
      const imageFiles = savedImagePaths.map((imagePath) => ({
        attachment: imagePath,
        name: path.basename(imagePath),
      }));

      const buttons = imageUrls.map((imageUrl, index) =>
        new ButtonBuilder()
          .setLabel(`Download ${index + 1}`)
          .setStyle(ButtonStyle.Link)
          .setURL(imageUrl)
          .setEmoji("1101133529607327764")
      );
      const row = new ActionRowBuilder().addComponents(...buttons);

      const resultEmbed = new EmbedBuilder()
        .setTitle("Leonardo AI")
        .addFields({ name: "Prompt", value: prompt })
        .addFields({ name: "Negative Prompt", value: negative_prompt || "-" })
        .addFields({
          name: "Model",
          value: getModelNameByValue(model),
        })
        .addFields({
          name: "Image Resolution",
          value: `${width}:${height}`,
        })
        .addFields({
          name: "Token Used",
          value: tokensUsed.toString() || "-",
        })
        .addFields({
          name: "Token Balance",
          value: updatedTokens.toString() || "-",
        })
        .setColor("#44a3e3")
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });
      await interaction.editReply({
        embeds: [resultEmbed],
        files: imageFiles,
        components: [row],
      });
    } catch (error) {
      const errEmbed = new EmbedBuilder()
        .setTitle("An error occurred")
        .setDescription("```" + error + "```")
        .setColor(0xe32424);

      interaction.editReply({ embeds: [errEmbed] });
    }
  },

  data: {
    name: "leonardo",
    description: "Generate an image with leonardo.ai .",
    options: [
      {
        name: "prompt",
        description: "Enter your prompt",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "negative_prompt",
        description: "Enter negative prompt",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "model_name",
        description: "The image model",
        type: ApplicationCommandOptionType.String,
        choices: models,
        required: false,
      },
      {
        name: "count",
        description: "Number of images to generate",
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
    ],
  },
};
