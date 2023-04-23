const {
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
} = require('discord.js');

// Buttons for pagination of embeds
const createPaginationButtonsRow = (previousDisabled, nextDisabled) => {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('previous')
        .setLabel('Previous')
        .setStyle('Primary')
        .setDisabled(previousDisabled),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next')
        .setStyle('Primary')
        .setDisabled(nextDisabled)
    );
};

// Embed for match notifications
const CreateMatchNotificationEmbed = ({title = 'Match Notifications', description = ' ', fields = []}) => {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor('#3ba55c')
    .setTimestamp()
    .addFields(fields)
    .setFooter({text: 'Powered by RoboEvents API'});
}

// Embed for warnings
const CreateWarningEmbed = ({title = 'Warning', description = ' ', fields = []}) => {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor('#ee7f49')
    .addFields(fields)
    .setTimestamp()
}

// Button for match notifications
const NotificationButtonRow = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setCustomId('notify')
      .setLabel('Match Notifications')
      .setStyle('Success')
      .setDisabled(false)
  );

module.exports = {
  createPaginationButtonsRow,
  CreateMatchNotificationEmbed,
  CreateWarningEmbed,
  NotificationButtonRow,
};