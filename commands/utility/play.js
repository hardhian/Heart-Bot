const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection } = require('@discordjs/voice');
const ytdl = require('youtube-dl-exec');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a YouTube video audio in a voice channel')
    .addStringOption(option => option.setName('url').setDescription('The YouTube URL').setRequired(true)),
  async execute(interaction) {
    const url = interaction.options.getString('url');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply('You need to be in a voice channel to play music!');
    }

    // Validate the URL
    const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeUrlPattern.test(url)) {
      return interaction.reply('The provided URL is not a valid YouTube URL.');
    }

    await interaction.deferReply(); // Acknowledge the interaction

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log('The bot has connected to the channel!');
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        // Seems to be reconnecting to a new channel - ignore disconnect
      } catch (error) {
        // Seems to be a real disconnect which shouldn't be recovered from
        connection.destroy();
      }
    });

    const player = createAudioPlayer();

    player.on(AudioPlayerStatus.Playing, () => {
      console.log('The audio player has started playing!');
    });

    player.on(AudioPlayerStatus.Idle, async () => {
      console.log('The audio player is now idle!');
      connection.destroy();
      await interaction.editReply('Finished playing!');
    });

    player.on('error', error => {
      console.error(`Error: ${error.message}`);
      connection.destroy();
      interaction.editReply('There was an error during playback.');
    });

    connection.subscribe(player);

    try {
      const stream = ytdl.exec(url, {
        output: '-',
        quiet: true,
        format: 'bestaudio',
        'rate-limit': '100K',
        'no-check-certificate': true,
      }, { stdio: ['ignore', 'pipe', 'ignore'] });

      const resource = createAudioResource(stream.stdout);

      player.play(resource);

      await interaction.editReply(`Playing audio from: ${url}`);
    } catch (error) {
      console.error('Error playing audio:', error);
      await interaction.editReply('There was an error trying to play the audio. Please try again later.');
      connection.destroy();
    }
  },
};
