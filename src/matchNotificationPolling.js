const {
  get_team_id,
  get_team_season_id,
  get_team_events,
  get_team_matches,
  get_event_divisions,
  get_event_matches
} = require("./roboteventsAPI.js")
const {
  CreateMatchNotificationEmbed,
} = require("./rows.js")

const client = require("./index.js")

// const fs = require('fs');
// const path = require('path');
// const json_file = path.join(__dirname, 'matchNotificationList.json');

// {
//   "match_id": {
//     "optedUsers": [
//       {
//         {
//           "user_id": "1234567890",
//           "matches_beforehand": 1,
//           "match_name": "Qualifier #12"
//         },
//       },
//     ],
//     "match_time": "2021-04-24T18:00:00.000Z",`
//     "tournament_id": "5331",
//     "division_id": "6",
//     "round": "2",
//     "match_number": "8",
//   }
// }
const matchNotificationList = {};

// Function to add a user to the list
const optUserForMatchNotifications = async (parameters) => {
  const {
    tournament_name,
    tournament_id,
    team_number,
    team_id,
    division_id,
    matches_beforehand,
    discord_user_id,
    discord_user_object,
  } = parameters;

 try {
  // ONLY NOTIFICATIONS FOR QUALIFICATIONS MATCHES ( Round 2 matches )
  const division_matches = await get_event_matches(tournament_id, division_id, 2);

  // Get all matches the team is in avoiding unnecessary API call
  const team_matches = division_matches.filter((match) => {
    return match.alliances.some((alliance) => {
      return alliance.teams.some((team) => {
        return team.team.id === team_id;
      });
    });
  });

  // Get each match matches_beforehand matches before each match the team is in using the matchnum property
  const matches_to_notify = division_matches.filter((match) => {
    return team_matches.some((team_match) => {
      // If the matchnum is less than matches_beforehand, then return true if the matchnum is the first match
      if (team_match.matchnum - matches_beforehand < 0) {
        return team_match.matchnum === division_matches[0].matchnum;
      }
      return team_match.matchnum === match.matchnum - matches_beforehand;
    });
  });

  matches_to_notify.forEach((match, index) => {
    // If the match is not in the list, add it
    if (!matchNotificationList[match.id]) {
      matchNotificationList[match.id] = {
        optedUsers: [],
        match_time: match.scheduled,
        tournament_id: tournament_id,
        division_id: division_id,
        round: match.round,
        match_number: match.matchnum,
      };
    }

    if (!matchNotificationList[match.id].optedUsers.some((user) => user.user_id === discord_user_id)) {
      // Add the user to the list of users to be notified
      matchNotificationList[match.id].optedUsers.push({
        user_id: discord_user_id,
        matches_beforehand: matches_beforehand,
        match_name: team_matches[index].name,
      });
    }
  });

  // Notify the user that they have been added to the list
  //  const confirm_message = `You will be notified for the following matches: ${matches_to_notify.map((match) => match.name).join(", ")}`;

   const ConfirmEmbed = CreateMatchNotificationEmbed({
      description: `You are set to receive notifications ${matches_beforehand} match(es) before ${team_number}'s matches at ${tournament_name.slice(0, 50)}`,
   });
   await discord_user_object.send({ embeds: [ConfirmEmbed] });

 } catch (error) {
   console.error(error);
 }
}


module.exports = {
  optUserForMatchNotifications,
}


// const matchNotificationList = JSON.parse(fs.readFileSync(json_file, 'utf8'));
// fs.writeFileSync(json_file, JSON.stringify(matchNotificationList, null, 2), 'utf8');