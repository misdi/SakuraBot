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

async function generateText(startingText) {
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

      const startingText = interaction.options.getString("input_text");
      const countText = interaction.options.getString("count");

      let count = 5; // Default value
      if (countText !== "") {
        count = parseInt(countText, 10); // Parse the countText as an integer
        if (isNaN(count)) {
          // If the provided countText is not a valid number, fallback to the default value
          count = 5;
        }
      }

      const maxCount = 15;

      const resultEmbed = new EmbedBuilder()
        .setTitle(`SD Prompt Generator (max ${maxCount})`)
        .addFields({ name: "Input Text", value: startingText })
        .setColor("#44a3e3")
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });
      for (let index = 0; index < count && index < maxCount; index++) {
        const text = await generateText(startingText);
        const trimmedText = text.replace(/,(\s*)$/, ""); // Trim the last comma and any trailing whitespace
        resultEmbed.addFields({
          name: `Prompt ${index + 1} :`,
          value: trimmedText,
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
    name: "promptsd",
    description: "SD Prompt Generator",
    options: [
      {
        name: "input_text",
        description: "Enter your Text",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "count",
        description: "how much prompt generated",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
};
