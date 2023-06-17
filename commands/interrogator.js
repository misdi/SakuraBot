const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
require("dotenv").config();
const Replicate = require("replicate");

async function generateImageToText(image_url) {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY,
  });

  const model =
    "pharmapsychotic/clip-interrogator:a4a8bafd6089e1716b06057c42b19378250d008b80fe87caa5cd36d40c1eda90";
  const output = await replicate.run(model, {
    input: {
      image: image_url,
    },
  });

  return output;
}

module.exports = {
  run: async ({ interaction }) => {
    try {
      await interaction.deferReply();

      const image_url_input = interaction.options.getString("image_url");
      const text = await generateImageToText(image_url_input);
      const resultEmbed = new EmbedBuilder()
        .setTitle(`CLIP Interrogator`)
        .addFields({ name: "Description", value: text })
        .setImage(image_url_input)
        .setColor("#44a3e3")
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

      await interaction.editReply({
        embeds: [resultEmbed],
      });
    } catch (error) {
      const errEmbed = new EmbedBuilder()
        .setTitle("Sepertinya error")
        .setDescription("```" + error + "```")
        .setColor(0xe32424);

      interaction.editReply({ embeds: [errEmbed] });
    }
  },

  data: {
    name: "interrogator",
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
