const { SlashCommandBuilder } = require('discord.js');
const { get_team_id, get_team_season_id, get_team_events } = require('../../roboteventsAPI');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tournaments')
		.setDescription('Sends of a list of a teams tournaments in the current season')
    .addStringOption(option =>
      option
        .setName('team_number')
				.setDescription('Team number')
        .setRequired(true)),

	async execute(interaction) {
		await interaction.deferReply();
    const team_number = (interaction.options.getString('team_number')).toUpperCase();
    const team_id = await get_team_id(team_number);
    const season_id = await get_team_season_id(team_id);
    const events = await get_team_events(team_id, season_id);
    const event_names = events.map(event => event.name);
		await interaction.editReply(`Events of team ${team_number} in the current season:\n` + event_names.join("\n"));
	},
};