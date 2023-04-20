const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Direct messages you back with "Pong!"'),
	async execute(interaction) {
		await interaction.reply('You should be sent a DM shortly!');
		await interaction.user.send('Pong!');
	},
};