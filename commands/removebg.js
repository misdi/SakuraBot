const axios = require("axios");
const { SlashCommandBuilder } = require("discord.js");
const FormData = require("form-data");
const fs = require("fs");

require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removebg")
    .setDescription("Remove Background Image")
    .addStringOption((option) =>
      option.setName("image_url")
        .setDescription("URL of the image")
        .setRequired(true)
    ),
  run: async ({ interaction }) => {
    const imageUrl = interaction.options.getString("image_url");

    try {
      // Acknowledge the interaction immediately
      await interaction.deferReply();

      const formData = new FormData();
      formData.append("image_url", imageUrl);
      formData.append("size", "auto");

      const headers = {
        "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
        "X-Api-Key": process.env.REMOVE_BG_API_KEY,
      };

      const response = await axios.post(
        "https://api.remove.bg/v1.0/removebg",
        formData,
        {
          headers: headers,
          responseType: "arraybuffer",
        }
      );

      // Save the response data to a file
      fs.writeFileSync("removed_bg.png", response.data);

      // Upload the file to the channel
      await interaction.followUp({
        files: ["removed_bg.png"],
        content: "Background removed image",
      });
    } catch (error) {
      console.error("Error removing background:", error);
      await interaction.reply(
        "An error occurred while removing the background."
      );
    }
  },
};
