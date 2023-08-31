require("dotenv").config();
const Replicate = require("replicate");
const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

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


module.exports = async (message, image_url_input) => {
  try {
    const reply = await message.reply({
      content: "Interrogator Processing...",
      fetchReply: true,
    });
    const text = await generateImageToText(image_url_input);
    const resultEmbed = new EmbedBuilder()
      .setTitle(`CLIP Interrogator`)
      .addFields({ name: "Description", value: text })
      .setImage(image_url_input)
      .setColor("#44a3e3")
      .setFooter({
        text: `Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      });
    await reply.edit(
      `CLIP Interrogator successfully! ${message.author.toString()}`
    );
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
