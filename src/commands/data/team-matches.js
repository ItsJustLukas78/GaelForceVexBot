const {get_team_id, get_team_season_id, get_team_events, get_team_matches } = require("../../roboteventsAPI");
const { optUserForMatchNotifications } = require("../../matchNotificationPolling");
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');
const {
  createPaginationButtonsRow,
  CreateMatchNotificationEmbed,
  CreateWarningEmbed,
  NotificationButtonRow,
} = require('../../rows');

// Exporting the command
module.exports = {
  data: new SlashCommandBuilder()
		.setName('team-matches')
		.setDescription('Sends the user a list of matches at a tournament given a team')
    .addStringOption(option =>
      option
        .setName('team_number')
				.setDescription('Team number')
        .setRequired(true)),

  // Command execution
	async execute(interaction) {
    // Defer the reply to the user, since discord requires a response within 3 seconds
    await interaction.deferReply();

    // Getting team and event information
    const team_number = (interaction.options.getString('team_number')).toUpperCase();
    const team_id = await get_team_id(team_number);

    if (!team_id) {
      const TeamIdWarningEmbed = CreateWarningEmbed({
        description: `No team found with number ${(team_number).slice(0, 10)}`
      });
      return interaction.editReply({ embeds: [TeamIdWarningEmbed]});
    }

    const season_id = await get_team_season_id(team_id);

    if (!season_id) {
      const SeasonIdWarningEmbed = CreateWarningEmbed({
        description: `No season found for team ${team_number}`
      });
      return interaction.editReply({ embeds: [SeasonIdWarningEmbed]});
    }

    const events = await get_team_events(team_id, season_id);

    // Creating the embed to prompt selection of a tournament
    const SelectTournamentEmbed = new EmbedBuilder()
      .setTitle('Select a tournament')
      .setDescription(`Select a tournament to see the matches for ${team_number}`)
      .setColor('#0099ff')
      .setTimestamp()
      .setFooter({text:'Powered by RoboEvents API'});

    // Creating the select menu consisting of the tournaments
    const SelectEventRow = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('team-event-list')
          .setPlaceholder('Make a selection!')
          .addOptions(
            events.map(event => {
              return new StringSelectMenuOptionBuilder()
                .setLabel(event.name.slice(0, 75))
                .setDescription(event.name.slice(0, 75))
                .setValue(event.id.toString())
            })
          )
      );

    // Edit the reply to the user with the embed and select menu
    const tournamentResponse = await interaction.editReply({
      components: [SelectEventRow],
      embeds: [SelectTournamentEmbed],
    });

    // Filter to only allow the user who sent the command to interact with components
    const filter = i => {
      return i.user.id === interaction.user.id;
    }

    try {
      const confirmation = await tournamentResponse.awaitMessageComponent({ filter, time: 60000 });

      // If the tournament select menu is interacted with
      if (confirmation.customId === 'team-event-list') {
        await confirmation.deferUpdate();
        const tournament_id = confirmation.values[0];
        const team_matches_response = await get_team_matches(team_id, tournament_id);
        const team_division = team_matches_response[0].division.id;
        const tournament_name = team_matches_response[0].event.name;

        // Creating an array of arrays consisting of to-be field objects representing a match
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

        // If no matches are found for some reason, edit message and return
        if (match_fields.length === 0) {
          const NonMatchesWarningEmbed = CreateWarningEmbed({
            description: `No matches found for ${team_number} at this event`
          });
          await interaction.followUp({ embeds: [NonMatchesWarningEmbed]});
          return;
        }

        // Calculating the number of pages needed to be used for pagination
        // Each embed can have max of 25 fields, but we want 5 matches per page
        const pages = Math.ceil(match_fields.length / 5);
        let page = 1;

        // Creating the embed listing the matches
        const MatchesEmbed = new EmbedBuilder()
          .setTitle(`Matches for ${team_number}`)
          .setDescription(team_matches_response[0].event.name.slice(0, 30) + '...')
          .setColor('#3b7ad4')
          .setTimestamp()
          .setFooter({text: `Page ${page} of ${pages}`})

          // Five arrays (matches) are flattened into one array of objects (fields)
          .addFields(match_fields.slice(0, 5).flat());


        // Follow up with the embed and pagination buttons
        const matchResponse = await interaction.followUp({
          embeds: [MatchesEmbed],
          components: pages > 1 ? [createPaginationButtonsRow(true, false), NotificationButtonRow] : [NotificationButtonRow],
        });

        // Collect interactions with buttons
        const matchListButtonsCollector = matchResponse.createMessageComponentCollector({ filter, time: 60000 });

        // If the user interacts with the buttons
        matchListButtonsCollector.on('collect', async i => {
          if (i.customId === 'next') {
            page++;
            MatchesEmbed.setFields(...match_fields.slice((page - 1) * 5, page * 5).flat());
            MatchesEmbed.setFooter({text: `Page ${page} of ${pages}`});
            await i.update({ embeds: [MatchesEmbed], components: [createPaginationButtonsRow(false, (page === pages)), NotificationButtonRow] });
          } else if (i.customId === 'previous') {
            page--;
            MatchesEmbed.setFields(...match_fields.slice((page - 1) * 5, page * 5).flat());
            MatchesEmbed.setFooter({text: `Page ${page} of ${pages}`});
            await i.update({ embeds: [MatchesEmbed], components: [createPaginationButtonsRow((page === 1), false), NotificationButtonRow] });
          } else if (i.customId === 'notify') {
            await i.deferUpdate();

            // Create list of number options for select menu
            const numberStringOptions = [...Array(11).keys()].slice(1).map(number => {
              return new StringSelectMenuOptionBuilder()
                  .setLabel((number).toString())
                  .setValue((number).toString());
            });

            // Create select component to select number of matches before each match to be notified
            const NumberSelectRow = new ActionRowBuilder()
              .addComponents(
                new StringSelectMenuBuilder()
                  .setCustomId('number-select')
                  .setPlaceholder('Select a number')
                  .addOptions(numberStringOptions.slice(1))
              );

            const SelectNumberNotificationEmbed = CreateMatchNotificationEmbed({
              description: 'Please select the number of precursor matches you would like to be notified before each match'
            });

            // Follow up with the embed and select menu
            const selectNotification = await i.followUp({ embeds: [SelectNumberNotificationEmbed], components: [NumberSelectRow] });

            // Wait for user to select a number
            const notificationConformation = await selectNotification.awaitMessageComponent({ filter, time: 60000 });

            // If the user selects a number
            if (notificationConformation.customId === 'number-select') {
              await notificationConformation.deferUpdate();
              const notification_number = notificationConformation.values[0];

              const ConfirmationMatchNotificationEmbed = CreateMatchNotificationEmbed({
              description: `Please check your DM's for confirmation on receiving match notifications for ${team_number}, ${notification_number} matches before each match!`
              });

              await notificationConformation.followUp({ embeds: [ConfirmationMatchNotificationEmbed], components: [] });

              // Add the user to the poller
              await optUserForMatchNotifications({
                tournament_name: tournament_name,
                tournament_id: tournament_id,
                team_number: team_number,
                team_id: team_id,
                division_id: team_division,
                matches_beforehand: notification_number,
                discord_user_id: interaction.user.id,
                discord_user_object: interaction.user,
              });
            }
          }
        });
      }
    } catch (e) {

      // Catch any errors that occur during user interaction
      console.log(e);
    }
	},
};