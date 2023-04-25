const { SlashCommandBuilder } = require('discord.js');
// const { getWSConnection } = require("../../websocket");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription("Sends a ping to Jaiveer's pager"),
	async execute(interaction) {
		await interaction.reply('Jaiveer will suffer ping in 5 seconds!');

		// const WS_connection = getWSConnection();
		// if (WS_connection && WS_connection.connected) {
		// 	console.log("Sending ping to Jaiveer");
		// 	// wait 5 seconds
		// 	setTimeout(() => {
		// 		WS_connection.sendUTF(JSON.stringify({ message: "0" }));
		// 	}, 5000);
		// }

	},
};