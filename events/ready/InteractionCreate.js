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

function parsePrompt(prompt) {
  let width = 640;
  let height = 832;
  let promptMagic = false;

  const resMatch = prompt.match(/--res\s+(\d+):(\d+)/i);
  if (resMatch) {
    width = parseInt(resMatch[1]);
    height = parseInt(resMatch[2]);
    prompt = prompt.replace(resMatch[0], "").trim();
  }

  const imageResolution = `${width}:${height}`;

  if (/\s+--pm/.test(prompt)) {
    promptMagic = true;
    prompt = prompt.replace(/--pm/, "").trim();
  }

  if (/\s+--nopm/.test(prompt)) {
    promptMagic = false;
    prompt = prompt.replace(/--nopm/, "").trim();
  }

  return { prompt, imageResolution, promptMagic };
}

module.exports = (client) => {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId === "regenerate") {
      // Get the data entered by the user
      const regPromptRec = interaction.fields.getTextInputValue("regPrompt");
      const regNegPromptRec =
        interaction.fields.getTextInputValue("regNegPrompt");
      const regCountRec = interaction.fields.getTextInputValue("regCount");
      const regModelRec = interaction.fields.getTextInputValue("regModel");
      const userName = interaction.user["username"];
      const {
        prompt: parsedPrompt,
        imageResolution,
        promptMagic,
      } = parsePrompt(regPromptRec);
      prompt = parsedPrompt;
      await leonardoGenerate(
        interaction,
        prompt.toString(),
        regNegPromptRec.toString(),
        regModelRec.toString(),
        imageResolution.toString(),
        promptMagic.toString(),
        regCountRec.toString(),
        userName
      );
    }
  });
};
