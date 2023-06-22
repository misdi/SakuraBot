const {
  ActionRowBuilder,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const leonardoGenerate = require("../../utils/leonardo/leonardoGenerate");

module.exports = (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
      const idBUtton = interaction.customId;
      const embeds = interaction.message.embeds[0];
      const fields = embeds.fields;
      // Extract values from the fields
      const prompt = fields[0].value;
      const negative_prompt = fields[1].value;
      const model = fields[2].value;
      const imageResolution = fields[3].value;
      const promptMagic = fields[4].value;
      const token = fields[5].value;
      const count = fields[6].value;
      const userName = interaction.user["username"];
      if (idBUtton == "regenerateButton") {
        await leonardoGenerate(
          interaction,
          prompt,
          negative_prompt,
          model,
          imageResolution,
          promptMagic,
          count,
          userName
        );
      }

      if (idBUtton == "remixButton") {
        const newPrompt = prompt + " --res " + imageResolution + (promptMagic === "true" ? " --pm" : "");

        const modal = new ModalBuilder()
          .setCustomId("regenerate")
          .setTitle("Remix");
        // Add components to modal

        // Create the text input components
        const regPrompt = new TextInputBuilder()
          .setCustomId("regPrompt")
          .setLabel("Input Prompt")
          .setMaxLength(1000)
          .setValue(newPrompt)
          .setStyle(TextInputStyle.Paragraph);
        const regNegPrompt = new TextInputBuilder()
          .setCustomId("regNegPrompt")
          .setLabel("Negative Prompt")
          .setMaxLength(1000)
          .setRequired(false)
          .setValue(negative_prompt)
          .setStyle(TextInputStyle.Paragraph);
        const regCount = new TextInputBuilder()
          .setCustomId("regCount")
          .setLabel("Count")
          .setRequired(false)
          .setValue(count)
          .setMaxLength(1)
          .setStyle(TextInputStyle.Short);
        const regModel = new TextInputBuilder()
          .setCustomId("regModel")
          .setLabel("Model")
          .setRequired(false)
          .setValue(model)
          .setStyle(TextInputStyle.Short);

        const firstActionRow = new ActionRowBuilder().addComponents(regPrompt);
        const secondActionRow = new ActionRowBuilder().addComponents(
          regNegPrompt
        );
        const thirdActionRow = new ActionRowBuilder().addComponents(regCount);
        const regModelRow = new ActionRowBuilder().addComponents(regModel);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, regModelRow);
        await interaction.showModal(modal);
      }
    }
  });
};
