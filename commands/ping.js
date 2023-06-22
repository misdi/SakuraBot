// const { SlashCommandBuilder } = require("discord.js");
const {
  ActionRowBuilder,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("reply with Pong!"),
  // run: async ({ interaction, client, handler }) => {
    run: ({ interaction, client, handler }) => {
    
    interaction.reply(`Pong! ${client.ws.ping}ms`);
  },
};
