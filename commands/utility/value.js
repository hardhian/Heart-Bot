const axios = require('axios');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('value')
    .setDescription('Fetches the value of a Roblox item from Rolimons')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('The name of the item')
        .setRequired(true)),
  async execute(interaction) {
    const itemName = interaction.options.getString('item');
    const url = 'https://www.rolimons.com/itemapi/itemdetails';

    await interaction.deferReply();  // Deferring the reply to handle long processing times

    try {
      const response = await axios.get(url);
      const items = response.data.items;
      const item = Object.values(items).find(item => item[0].toLowerCase() === itemName.toLowerCase());

      if (!item) {
        await interaction.editReply(`Item "${itemName}" not found.`);
        return;
      }

      const itemData = {
        name: item[0],
        value: item[3],
        demand: item[5],
        imageUrl: `https://www.rolimons.com/images/items/${item[2]}.png`,
      };

      const embed = new EmbedBuilder()
        .setTitle(itemData.name)
        .setThumbnail(itemData.imageUrl)
        .addFields(
          { name: 'Value', value: itemData.value.toString(), inline: true },
          { name: 'Demand', value: itemData.demand.toString(), inline: true },
        )
        .setColor('#00FF00')
        .setFooter({ text: 'Data from Rolimons' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching item data:', error);
      await interaction.editReply('There was an error fetching the item data.');
    }
  },
};
