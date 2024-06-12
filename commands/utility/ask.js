const axios = require('axios');
const { SlashCommandBuilder } = require('discord.js');

const apiKey = 'sk-proj-ueVulq0xUjpVt44ZhsMAT3BlbkFJ9EZoppqL9MPVWe7aHJh4';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask ChatGPT a question')
        .addStringOption(option => option.setName('question').setDescription('The question to ask').setRequired(true)),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        await interaction.deferReply(); // Acknowledge the interaction and give more time for the response

        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: question }],
                max_tokens: 150,
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            const answer = response.data.choices[0].message.content.trim();
            await interaction.editReply(answer);
        } catch (error) {
            console.error('Error fetching ChatGPT response:', error.response.data);
            let errorMessage = 'There was an error while executing this command!';

            if (error.response && error.response.data.error.code === 'insufficient_quota') {
                errorMessage = 'You have exceeded your API quota. Please check your OpenAI plan and billing details.';
            }

            if (!interaction.replied) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
