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
const models = require("../../models_leonardo");
const getIdModel = require("./getIdModel");
const createGeneration = require("./createGeneration");
const saveImage = require("./saveImage");
const sdk = require("api")("@leonardoai/v1.0#28807z41owlgnis8jg");

function extractWidthHeight(str) {
  const [widthOri, heightOri] = str.split(":");
  return { widthOri: parseInt(widthOri), heightOri: parseInt(heightOri) };
}
async function getUserSelf() {
  sdk.auth(process.env.LEONARDO_API_KEY);
  try {
    const { data } = await sdk.getUserSelf();
    return data;
  } catch (err) {
    console.error(err);
  }
}
async function getGenerationById(id_data) {
  sdk.auth(process.env.LEONARDO_API_KEY);
  try {
    const { data } = await sdk.getGenerationById({ id: id_data });
    return data;
  } catch (err) {
    console.error(err);
  }
}
function getModelNameByValue(modelValue) {
  for (const model of models) {
    if (model.value === modelValue) {
      return model.name;
    }
  }
  return "-"; // Return null if no model with the given value is found
}

function parsePrompt(prompt, widthOri, heightOri, promptMagicOri) {
  let width = 640;
  let height = 832;
  let promptMagic = false;

  const resMatch = prompt.match(/--res\s+(\d+):(\d+)/i);
  if (resMatch) {
    width = parseInt(resMatch[1]);
    height = parseInt(resMatch[2]);
    prompt = prompt.replace(resMatch[0], "").trim();
  } else {
    width = widthOri;
    height = heightOri;
    prompt = prompt;
  }

  if (/\s+--pm/.test(prompt)) {
    promptMagic = true;
    prompt = prompt.replace(/--pm/, "").trim();
  } else {
    promptMagic = promptMagicOri;
    prompt = prompt;
  }

  if (/\s+--nopm/.test(prompt)) {
    promptMagic = false;
    prompt = prompt.replace(/--nopm/, "").trim();
  } else {
    promptMagic = promptMagicOri;
    prompt = prompt;
  }

  return { prompt, width, height, promptMagic };
}

module.exports = async (
  interaction,
  promptOri,
  negative_prompt,
  model_name,
  imageResolution,
  promptMagicString,
  countString,
  userName
) => {
  try {
    await interaction.deferReply();

    const promptMagicOri = promptMagicString.toLowerCase() === "true";
    const count = parseInt(countString);
    const model = getIdModel(model_name, models);
    const { widthOri, heightOri } = extractWidthHeight(imageResolution);

    const {
      prompt: parsedPrompt,
      width,
      height,
      promptMagic,
    } = parsePrompt(promptOri, widthOri, heightOri, promptMagicOri);
    prompt = parsedPrompt;

    const id_generation = await createGeneration(
      prompt,
      negative_prompt,
      model,
      width,
      height,
      promptMagic,
      count,
      interaction
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
        userName,
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
        .setLabel(`${index + 1}`)
        .setStyle(ButtonStyle.Link)
        .setURL(imageUrl)
        .setEmoji("1101133529607327764")
    );
    const row = new ActionRowBuilder().addComponents(...buttons);

    const regenerateButton = new ButtonBuilder()
      .setCustomId("regenerateButton")
      .setLabel("Regenerate")
      .setStyle(ButtonStyle.Success);
    const remixButton = new ButtonBuilder()
      .setCustomId("remixButton")
      .setLabel("Remix")
      .setStyle(ButtonStyle.Success);
    // row.addComponents(regenerateButton, remixButton);
    const buttonRow = new ActionRowBuilder()
      .addComponents(regenerateButton)
      .addComponents(remixButton);

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
        name: "Prompt Magic",
        value: promptMagic.toString() || "-",
      })
      .addFields({
        name: "Token",
        value: `Used : ${tokensUsed.toString() || "-"} | Balance ${
          updatedTokens.toString() || "-"
        }`,
      })
      .addFields({
        name: "Count",
        value: count.toString() || "1",
      })
      .setColor("#44a3e3")
      .setFooter({
        text: `Requested by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });
    await interaction.editReply({
      content: `Regenerate for ${interaction.user.toString()}`,
      embeds: [resultEmbed],
      files: imageFiles,
      components: [row, buttonRow],
    });
  } catch (error) {
    // console.log(error)
    const errEmbed = new EmbedBuilder()
      // .setTitle("An error occurred")
      .setDescription("Mungkin NSFW atau resolusi tidak sesuai")
      .setColor(0xe32424);

    interaction.editReply({ embeds: [errEmbed] });
  }
};
