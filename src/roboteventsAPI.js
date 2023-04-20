const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const API_KEY = process.env.ROBOT_EVENTS_TOKEN;

// Get the team id from the team number
async function get_team_id(team_number) {
  const url = "https://www.robotevents.com/api/v2/teams";
  const new_headers = {
    "accept": "application/json",
    "Authorization": "Bearer " + API_KEY,
  };
  const new_params = { number: team_number };

  try {
    const response = await axios.get(url, { params: new_params, headers: new_headers });

    if (response.status === 200) {
      try {
        return response.data.data[0].id;
      } catch (error) {
        console.warn("Error: " + response.status + " getting team id");
        return null;
      }
    } else if (response.status === 429) {
        const wait_time = parseInt(response.headers["retry-after"] || "5") + 1;
        console.warn(`Sleeping for ${wait_time} seconds`);
        await new Promise((resolve) => setTimeout(resolve, wait_time * 1000));
        return get_team_id(team_number);
    } else {
        console.warn("Error: " + response.status + " getting team id");
        return null;
    }
  } catch (error) {
    console.error(error);
  }
}

// Given a team id, find the teams current season id
async function get_team_season_id(team_id) {
  const url = "https://www.robotevents.com/api/v2/seasons";
  const new_headers = {
    "accept": "application/json",
    "Authorization": "Bearer " + API_KEY,
  };
  const new_params = { team: team_id, active: true };

  try {
    const response = await axios.get(url, { params: new_params, headers: new_headers });

    if (response.status === 200) {
      try {
        return response.data.data[0].id;
      } catch (error) {
        console.warn("Error: " + response.status + " getting season id");
        return null;
      }
    } else if (response.status === 429) {
        const wait_time = parseInt(response.headers["retry-after"] || "5") + 1;
        console.warn(`Sleeping for ${wait_time} seconds`);
        await new Promise((resolve) => setTimeout(resolve, wait_time * 1000));
        return get_team_season_id(team_id);
    } else {
        console.warn("Error: " + response.status + " getting season id");
        return null;
    }
  } catch (error) {
    console.error(error);
  }
}

// Get a list of all the events given team id and season id
async function get_team_events(team_id, season_id) {
  const url = `https://www.robotevents.com/api/v2/teams/${team_id}/events`;
  const new_headers = {
    "accept": "application/json",
    "Authorization": "Bearer " + API_KEY,
  };
  const new_params = { season: season_id };

  const team_events = [];

  try {
    const response = await axios.get(url, { headers: new_headers, params: new_params });

    if (response.status !== 200) {
      console.log("Error: " + response.status + " getting team events");

      if (response.status === 429) {
        const wait_time = parseInt(response.headers["retry-after"] || "5") + 1;
        console.log(`Sleeping for ${wait_time} seconds`);
        await new Promise((resolve) => setTimeout(resolve, wait_time * 1000));
        return get_team_events(team_id, season_id);
      } else {
        return null;
      }
    } else {
      team_events.push(...response.data.data);

      let next_page_url = response.data.meta.next_page_url;


      while (next_page_url) {
        const nextPageResponse = await axios.get(next_page_url, { headers: new_headers });

        if (nextPageResponse.status !== 200) {
          console.log("Error: " + nextPageResponse.status + " getting teams events");
          return null;
        }

        next_page_url = nextPageResponse.data.meta.next_page_url;

        team_events.push(...nextPageResponse.data.data);
      }

      return team_events.filter((event, index, self) => {
        return index === self.findIndex((t) => t.id === event.id);
      });
    }
  } catch (error) {
    console.error(error);
  }
}

// Get the matches for a given event where the team is participating in
async function get_team_matches(team_id, event_id) {
  const url = `https://www.robotevents.com/api/v2/teams/${team_id}/matches`;
  const new_headers = {
    "accept": "application/json",
    "Authorization": "Bearer " + API_KEY,
  };
  const new_params = { event: event_id };

  const team_matches = [];

  try {
    const response = await axios.get(url, { headers: new_headers, params: new_params });

    if (response.status !== 200) {
      console.log("Error: " + response.status + " getting team matches");

      if (response.status === 429) {
        const wait_time = parseInt(response.headers["retry-after"] || "5") + 1;
        console.log(`Sleeping for ${wait_time} seconds`);
        await new Promise((resolve) => setTimeout(resolve, wait_time * 1000));
        return get_team_matches(team_id, event_id);
      } else {
        return null;
      }
    } else {
      team_matches.push(...response.data.data);

      let next_page_url = response.data.meta.next_page_url;

      while (next_page_url) {
        const nextPageResponse = await axios.get(next_page_url, { headers: new_headers });

        if (nextPageResponse.status !== 200) {
          console.log("Error: " + nextPageResponse.status + " getting teams matches");
          return null;
        }

        next_page_url = nextPageResponse.data.meta.next_page_url;
        team_matches.push(...nextPageResponse.data.data);
      }

      return team_matches;
    }
  } catch (error) {
    console.error(error);
  }
}

module.exports = { get_team_id, get_team_season_id, get_team_events, get_team_matches };

// // Get the event id from the event code since the API does not use event code for other requests
// async function get_event_id(event_code) {
//   const url = "https://www.robotevents.com/api/v2/events";
//   const new_headers = {
//     "accept": "application/json",
//     "Authorization": "Bearer " + API_KEY,
//   };
//   const new_params = { sku: event_code };
//
//   try {
//     const response = await axios.get(url, { params: new_params, headers: new_headers });
//
//     if (response.status === 200) {
//       try {
//         return response.data.data[0].id;
//       } catch (error) {
//         console.warn("Error: " + response.status + " getting event id");
//         return null;
//       }
//     } else {
//       console.warn("Error: " + response.status + " getting event id");
//
//       if (response.status === 429) {
//         const wait_time = parseInt(response.headers["retry-after"] || "5") + 1;
//         console.warn(`Sleeping for ${wait_time} seconds`);
//         await new Promise((resolve) => setTimeout(resolve, wait_time * 1000));
//         return get_event_id(event_code);
//       } else {
//         return null;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//   }
// }


// // Get a list of the teams from the event using the event id
// async function get_teams(event_id) {
//   const url = `https://www.robotevents.com/api/v2/events/${event_id}/teams`;
//   const new_headers = {
//     "accept": "application/json",
//     "Authorization": "Bearer " + API_KEY,
//   };
//
//   const teams = [];
//
//   try {
//     const response = await axios.get(url, { headers: new_headers });
//
//     if (response.status !== 200) {
//       console.log("Error: " + response.status + " getting teams");
//
//       if (response.status === 429) {
//         const wait_time = parseInt(response.headers["retry-after"] || "5") + 1;
//         console.log(`Sleeping for ${wait_time} seconds`);
//         await new Promise((resolve) => setTimeout(resolve, wait_time * 1000));
//         return get_teams(event_id);
//       } else {
//         return null;
//       }
//     } else {
//       teams.push(...response.data.data);
//
//       let next_page_url = response.data.meta.next_page_url;
//
//       while (next_page_url) {
//         const nextPageResponse = await axios.get(next_page_url, { headers: new_headers });
//
//         if (nextPageResponse.status !== 200) {
//           console.log("Error: " + nextPageResponse.status + " getting teams");
//           return null;
//         }
//
//         next_page_url = nextPageResponse.data.meta.next_page_url;
//         teams.push(...nextPageResponse.data.data);
//       }
//
//       return teams;
//     }
//   } catch (error) {
//     console.error(error);
//   }
// }