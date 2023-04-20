const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder, Faces,
} = require('discord.js');
const {get_team_id, get_team_season_id, get_team_events, get_team_matches } = require("../../roboteventsAPI");

const PaginationButtons = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setCustomId('previous')
      .setLabel('Previous')
      .setStyle('Primary')
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('next')
      .setLabel('Next')
      .setStyle('Primary')
      .setDisabled(false)
  );

const NotificationButton = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setCustomId('notify')
      .setLabel('Match Notifications')
      .setStyle('Success')
      .setDisabled(false)
  );

const createNotificationEmbed = new EmbedBuilder()
  .setTitle(`Match Notifications`)
  .setDescription(`Please select the number of precursor matches you would like to be notified before a match`)
  .setColor('#3ba55c')
  .setTimestamp()
  .setFooter({text: 'Powered by RoboEvents API'});

module.exports = {
  data: new SlashCommandBuilder()
		.setName('team-matches')
		.setDescription('Sends the user a list of matches at a tournament given a team')
    .addStringOption(option =>
      option
        .setName('team_number')
				.setDescription('Team number')
        .setRequired(true)),
	// data: new SlashCommandBuilder()...
	async execute(interaction) {
      await interaction.deferReply();
      const team_number = (interaction.options.getString('team_number')).toUpperCase();
      const team_id = await get_team_id(team_number);
      const season_id = await get_team_season_id(team_id);
      const events = await get_team_events(team_id, season_id);

      // Send an embed to tell the user to select a tournament
      const embed = new EmbedBuilder()
        .setTitle('Select a tournament')
        .setDescription(`Select a tournament to see the matches for ${team_number}`)
        .setColor('#0099ff')
        .setTimestamp()
        .setFooter({text:'Powered by RoboEvents API'});

      const select = new StringSelectMenuBuilder()
			.setCustomId('team-event-list')
			.setPlaceholder('Make a selection!')
			.addOptions(
        events.map(event => {
          return new StringSelectMenuOptionBuilder()
            .setLabel(event.name.slice(0, 75))
            .setDescription(event.name.slice(0, 75))
            .setValue(event.id.toString())
        })
			);

      const row = new ActionRowBuilder()
        .addComponents(select);

      const tournamentResponse = await interaction.editReply({
        components: [row],
        embeds: [embed],
      });

      const filter = i => {
        return i.user.id === interaction.user.id;
      }
      try {
        const confirmation = await tournamentResponse.awaitMessageComponent({ filter, time: 60000 });

        if (confirmation.customId === 'team-event-list') {
          await confirmation.deferUpdate();
          const team_matches_response = await get_team_matches(team_id, confirmation.values[0]);

          const match_fields = team_matches_response.map(match => {
            return [
              {
                name: match.name + ' - ' + match.field,
                value: ' ',
                inline: false,
              },
              {
                name: 'RED',
                value: match.alliances.find(alliance => alliance.color === 'red').teams.map(team => team.team.name).join(' | '),
                inline: true,
              },
              {
                name: 'BLUE',
                value: match.alliances.find(alliance => alliance.color === 'blue').teams.map(team => team.team.name).join(' | '),
                inline: true,
              },
            ];
          });

          if (match_fields.length === 0) {
            await interaction.editReply({
              content: `No matches found for this ${team_number} at this event`,
              components: [],
              embeds: [],
            });
            return;
          }

          const pages = Math.ceil(match_fields.length / 5);
          let page = 1;

          const MatchesEmbed = new EmbedBuilder()
            .setTitle(`Matches for ${team_number}`)
            .setDescription(team_matches_response[0].event.name.slice(0, 30) + '...')
            .setColor('#3b7ad4')
            .setTimestamp()
            .setFooter({text: `Page ${page} of ${pages}`})
            .addFields(...match_fields.slice(0, 5).flat());


          const matchResponse = await interaction.followUp({
            embeds: [MatchesEmbed],
            components: pages > 1 ? [PaginationButtons, NotificationButton] : [NotificationButton],
          });

          const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

          collector.on('collect', async i => {
            if (i.customId === 'next') {
              page++;
              MatchesEmbed.setFields(...match_fields.slice((page - 1) * 5, page * 5).flat());
              MatchesEmbed.setFooter({text: `Page ${page} of ${pages}`});
              PaginationButtons.components[0].setDisabled(false);
              if (page === pages) {
                PaginationButtons.components[1].setDisabled(true);
              }
              await i.update({ embeds: [MatchesEmbed], components: [PaginationButtons, NotificationButton] });
            } else if (i.customId === 'previous') {
              page--;
              MatchesEmbed.setFields(...match_fields.slice((page - 1) * 5, page * 5).flat());
              MatchesEmbed.setFooter({text: `Page ${page} of ${pages}`});
              PaginationButtons.components[1].setDisabled(false);
              if (page === 1) {
                PaginationButtons.components[0].setDisabled(true);
              }
              await i.update({ embeds: [MatchesEmbed], components: [PaginationButtons, NotificationButton] });
            } else if (i.customId === 'notify') {
              await i.deferUpdate();

              const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(number => {
                return new StringSelectMenuOptionBuilder()
                  .setLabel(number)
                  .setValue(number);
              });

              const numberSelect = new StringSelectMenuBuilder()
                .setCustomId('number-select')
                .setPlaceholder('Select a number')
                .addOptions(numbers)

              const numberRow = new ActionRowBuilder()
                .addComponents(numberSelect);

              createNotificationEmbed.setDescription('Please select the number of precursor matches you would like to be notified before each match')
              const selectNotification = await i.followUp({ embeds: [createNotificationEmbed], components: [numberRow] });

              const notificationConformation = await interaction.channel.awaitMessageComponent({ filter, time: 60000 });


              if (notificationConformation.customId === 'number-select') {
                console.log('here');
                await notificationConformation.deferUpdate();
                const notification_number = notificationConformation.values[0];

                createNotificationEmbed.setDescription(`Match notifications for ${team_number} will be DMed to you ${notification_number} matches before each match`)
                await notificationConformation.followUp({ embeds: [createNotificationEmbed], components: [] });
              }
            }
          });
        }
      } catch (e) {
        console.log(e);
        await interaction.editReply({ content: 'You did not respond in time or error occured!', components: [], embeds: []});
      }
	},
};