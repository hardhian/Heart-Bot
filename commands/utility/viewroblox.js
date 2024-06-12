const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription('Displays information about a Roblox character by their ID')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('The Roblox ID of the character')
        .setRequired(true)),
  async execute(interaction) {
    const userId = interaction.options.getString('id');
    const profileUrl = `https://users.roblox.com/v1/users/${userId}`;
    const thumbnailUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`;

    await interaction.deferReply();

    try {
      const [profileResponse, thumbnailResponse] = await Promise.all([
        fetch(profileUrl),
        fetch(thumbnailUrl)
      ]);

      if (!profileResponse.ok || !thumbnailResponse.ok) {
        throw new Error('Error fetching data from Roblox API');
      }

      const profileData = await profileResponse.json();
      const thumbnailData = await thumbnailResponse.json();
      const imageUrl = thumbnailData.data[0].imageUrl;

      const embed = new EmbedBuilder()
        .setTitle(profileData.displayName)
        .setThumbnail(imageUrl)
        .addFields(
          { name: 'Username', value: profileData.name, inline: true },
          { name: 'Join Date', value: new Date(profileData.created).toDateString(), inline: true },
          { name: 'Last Online', value: profileData.lastOnline ? new Date(profileData.lastOnline).toDateString() : 'Unknown', inline: true }
        )
        .setColor('#00FF00')
        .setFooter({ text: 'Data from Roblox API' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching character data:', error);
      await interaction.editReply('There was an error fetching the character data.');
    }
  },
};
