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

async function saveImage(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const contentDisposition = response.headers["content-disposition"];
    const fileName = contentDisposition
      ? contentDisposition.match(/filename="?(.+?)"?$/)[1]
      : path.basename(url);

    const parentFolderPath = path.join(__dirname, "..");
    const folderPath = path.join(parentFolderPath, "generated");
    const baseFileName = path.parse(fileName).name;
    const fileExt = path.parse(fileName).ext;

    let newFileName = fileName;
    let count = 1;
    while (fs.existsSync(path.join(folderPath, newFileName))) {
      newFileName = `${baseFileName}_${count}${fileExt}`;
      count++;
    }

    const filePath = path.join(folderPath, newFileName);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));
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
async function createGeneration(prompt, negative_prompt, model) {
  sdk.auth(process.env.LEONARDO_API_KEY);

  try {
    const { data } = await sdk.createGeneration({
      prompt: prompt,
      negative_prompt: negative_prompt,
      modelId: model,
      num_images: 1,
      width: 640,
      height: 832,
      public: false,
      guidance_scale: 7,
      presetStyle: "LEONARDO",
    });
    const id_generations = data.sdGenerationJob.generationId;
    return id_generations;
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

module.exports = {
  run: async ({ interaction }) => {
    try {
      await interaction.deferReply();

      const prompt = interaction.options.getString("prompt");
      const negative_prompt = interaction.options.getString("negative_prompt");
      const model =
        interaction.options.getString("model_name") || models[0].value;

      const id_generation = await createGeneration(
        prompt,
        negative_prompt,
        model
      );
      await new Promise((resolve) => setTimeout(resolve, 20000));

      const generationData = await getGenerationById(id_generation);
      const generated_image = generationData.generations_by_pk.generated_images;
      const imageUrl = generated_image[0].url;
      const savedImagePath = await saveImage(imageUrl);
      const savedImageFileName = path.basename(savedImagePath);
      const seed = generationData.generations_by_pk.seed;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(`Download`)
          .setStyle(ButtonStyle.Link)
          .setURL(imageUrl)
          .setEmoji("1101133529607327764")
      );
      //   if (countText !== "") {
      const resultEmbed = new EmbedBuilder()
        .setTitle("Leonardo AI")
        .addFields({ name: "Prompt", value: prompt })
        .addFields({ name: "Negative Prompt", value: negative_prompt || "-" })
        .addFields({
          name: "Model",
          value: getModelNameByValue(model),
        })
        .addFields({
          name: "Seed",
          value: seed !== undefined ? seed.toString() : "-",
        })
        // .setImage(imageUrl)
        .setImage(`attachment://${savedImageFileName}`)
        .setColor("#44a3e3")
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

      await interaction.editReply({
        embeds: [resultEmbed],
        files: [
          {
            attachment: savedImagePath,
            name: savedImageFileName,
          },
        ],
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
    ],
  },
};
