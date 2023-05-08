const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const API_KEY = process.env.ROBOT_EVENTS_TOKEN;

async function apiCall(url, headers, params) {
  try {
    const response = await axios.get(url, { headers, params: params ? params : {} });

    if (response.status === 429) {
      const wait_time = parseInt(response.headers["retry-after"] || "5") + 1;
      console.log(`Sleeping for ${wait_time} seconds`);
      await new Promise((resolve) => setTimeout(resolve, wait_time * 1000));
      return apiCall(url, headers, params);
    }

    return response;
  } catch (error) {
    throw error;
  }
}


// Get the team id from the team number
async function get_team_id(team_number) {
  const url = "https://www.robotevents.com/api/v2/teams";
  const new_headers = {
    "accept": "application/json",
    "Authorization": "Bearer " + API_KEY,
  };
  const new_params = { number: team_number };

  try {
    const response = await apiCall(url, new_headers, new_params)

    const team_id = response.data.data[0]?.id;
    if (!team_id) {
      console.warn("Warning: No id could be found");
      return null;
    }

    return team_id;

  } catch (error) {
    console.error(error);
    return null;
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
    const response = await apiCall(url, new_headers, new_params);

    const season_id = response.data.data[0]?.id;
    if (!season_id) {
      console.warn("Warning: No season id could be found");
      return null;
    }

    return season_id;

  } catch (error) {
    console.error(error);
    return null;
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
    const response = await apiCall(url, new_headers, new_params);

    team_events.push(...response.data.data);

    let next_page_url = response.data.meta.next_page_url;

    while (next_page_url) {
      const nextPageResponse = await apiCall(next_page_url, new_headers);

      next_page_url = nextPageResponse.data.meta.next_page_url;

      team_events.push(...nextPageResponse.data.data);
    }

    // API may return duplicate events, so filter them out
    return team_events.filter((event, index, self) => {
      return index === self.findIndex((t) => t.id === event.id);
    });
  } catch (error) {
    console.error(error);
    return [];
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
    const response = await apiCall(url, new_headers, new_params)

    team_matches.push(...response.data.data);

    let next_page_url = response.data.meta.next_page_url;

    while (next_page_url) {
      const nextPageResponse = await apiCall(next_page_url, new_headers);

      next_page_url = nextPageResponse.data.meta.next_page_url;

      team_matches.push(...nextPageResponse.data.data);
    }

    return team_matches;

  } catch (error) {
    console.error(error);
    return [];
  }
}


// Get all the divisions for a given event
async function get_event_divisions(event_id) {
  const url = `https://www.robotevents.com/api/v2/events/${event_id}`;
  const new_headers = {
    "accept": "application/json",
    "Authorization": "Bearer " + API_KEY,
  };
  const new_params = { event: event_id };

  try {
    const response = await apiCall(url, new_headers, new_params);

    const divisions = response.data?.divisions;

    if (!divisions) {
      console.warn("Warning: No divisions could be found");
      return null;
    }

    return divisions.map((division) => division.id);

  } catch (error) {
    console.error(error);
    return null;
  }
}

// Get all matches at an event given the event id and division
async function get_event_matches(event_id, division_id, round, matchnum) {
  const url = `https://www.robotevents.com/api/v2/events/${event_id}/divisions/${division_id}/matches`;
  const new_headers = {
    "accept": "application/json",
    "Authorization": "Bearer " + API_KEY,
  };

  const new_params = { round: round ? round : {}, matchnum: matchnum ? matchnum : {}};

  const division_matches = [];

  try {
    const response = await apiCall(url, new_headers, new_params)

    division_matches.push(...response.data.data);

    let next_page_url = response.data.meta.next_page_url;

    while (next_page_url) {
      const nextPageResponse = await apiCall(next_page_url, new_headers, new_params);

      next_page_url = nextPageResponse.data.meta.next_page_url;

      division_matches.push(...nextPageResponse.data.data);
    }

    return division_matches;

  } catch (error) {
    console.error(error);
    return [];
  }
}

module.exports = { get_team_id, get_team_season_id, get_team_events, get_team_matches, get_event_divisions, get_event_matches };
