const axios = require("axios");
const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const FormData = require("form-data");
const fs = require("fs");
require("dotenv").config();
const _ = require("lodash");

const { HfInference } = require("@huggingface/inference");
const hf = new HfInference(process.env.HUGGING_KEY);

async function generateImageToText(image_url) {
  const result = await hf.imageToText({
    model: "nlpconnect/vit-gpt2-image-captioning",
    data: image_url,
  });
  const generatedText = result.generated_text.trim();
  return generatedText;
}

async function generateTextMJ(startingText) {
  const seed = _.random(200, 300);

  const result = await hf.textGeneration({
    model: "succinctly/text2image-prompt-generator",
    inputs: startingText,
    max_length: seed,
    num_return_sequences: 8,
  });
  const generatedText = result.generated_text.trim();
  return generatedText;
}

async function generateTextSD(startingText) {
  const seed = _.random(200, 300);

  const result = await hf.textGeneration({
    model: "Gustavosta/MagicPrompt-Stable-Diffusion",
    tokenizer: "gpt2",
    inputs: startingText,
    max_length: seed,
    num_return_sequences: 5,
  });
  const generatedText = result.generated_text.trim();
  return generatedText;
}

module.exports = {
  run: async ({ interaction }) => {
    try {
      await interaction.deferReply();

      const image_url_input = interaction.options.getString("image_url");
      const text = await generateImageToText(image_url_input);
      const resultEmbed = new EmbedBuilder()
        .setTitle(`Image to Text`)
        .addFields({ name: "Description", value: text })
        .setImage(image_url_input)
        .setColor("#44a3e3")
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

        for (let index = 0; index < 3; index++) {
          const textMJ = await generateTextMJ(text);
          const trimmedTextMJ = textMJ.replace(/,(\s*)$/, ""); // Trim the last comma and any trailing whitespace
          resultEmbed.addFields({
            name: `MJ Prompt ${index + 1} :`,
            value: trimmedTextMJ,
          });
        }
        for (let index = 0; index < 3; index++) {
          const textSD = await generateTextSD(text);
          const trimmedTextSD = textSD.replace(/,(\s*)$/, ""); // Trim the last comma and any trailing whitespace
          resultEmbed.addFields({
            name: `SD Prompt ${index + 1} :`,
            value: trimmedTextSD,
          });
        }

      await interaction.editReply({
        embeds: [resultEmbed],
      });
    } catch (error) {
      const errEmbed = new EmbedBuilder()
        .setTitle("Sepertinya sedang error")
        .setDescription("```" + error + "```")
        .setColor(0xe32424);

      interaction.editReply({ embeds: [errEmbed] });
    }
  },

  data: {
    name: "caption",
    description: "Image to Text",
    options: [
      {
        name: "image_url",
        description: "Enter image url",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
};
