const { SlashCommandBuilder } = require('discord.js');
const { getWSConnection } = require("../../websocket");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription("Sends a ping to Jaiveer's pager"),
	async execute(interaction) {
		await interaction.reply('Jaiveer will suffer ping in 5 seconds!');
		console.log(interaction.user.id);

		const WS_connection = getWSConnection();
		if (WS_connection && WS_connection.connected) {
			console.log("Sending ping to Jaiveer");
			// wait 5 seconds
			if (interaction.user.id === process.env.JAIVEER_ID || interaction.user.id === process.env.LUKAS_ID) {
				for (let i = 0; i < 5; i++) {
					setTimeout(() => {
						WS_connection.sendUTF(JSON.stringify({ message: "0" }));
					}, 1000);
				}
			} else {
				setTimeout(() => {
						WS_connection.sendUTF(JSON.stringify({ message: "0" }));
					}, 1000);
			}
		}

	},
};