require("dotenv").config();
const Replicate = require("replicate");
const { HfInference } = require("@huggingface/inference");
const hf = new HfInference(process.env.HUGGING_KEY);
const _ = require("lodash");

const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

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

module.exports = async (message, image_url_input) => {
  try {
    const reply = await message.reply({
      content: "Caption Processing...",
      fetchReply: true,
    });
    const text = await generateImageToText(image_url_input);
    const resultEmbed = new EmbedBuilder()
      .setTitle(`Caption the image`)
      .addFields({ name: "Description", value: text })
      .setImage(image_url_input)
      .setColor("#44a3e3")
      .setFooter({
        text: `Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
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

    await reply.edit(`Caption successfully! ${message.author.toString()}`);
    await reply.edit({
      embeds: [resultEmbed],
    });
  } catch (error) {
    // console.log(error)
    const errEmbed = new EmbedBuilder()
      .setTitle("Sepertinya error")
      .setDescription("```" + error + "```")
      .setColor(0xe32424);

    message.reply({ embeds: [errEmbed] });
  }
};
