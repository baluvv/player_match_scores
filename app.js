const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let database = null;

//Get All Players Details API

const startDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

startDbAndServer();

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
    player_id AS playerId,
    player_name AS playerName
    FROM player_details;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(playersArray);
});

//Get Player With Id API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getSinglePlayerQuery = `
    SELECT
    player_id as playerId,
    player_name AS playerName
    FROM player_details
    WHERE player_id= ${playerId};`;
  const player = await database.get(getSinglePlayerQuery);
  response.send(player);
});

//Update Player Details API
app.put("/players/:playerId/", async (request, response) => {
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const { playerId } = request.params;

  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name= '${playerName}'
    WHERE player_id= ${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Match Details API
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT
    match_id AS matchId,
    match,
    year
    FROM match_details
    WHERE match_id= ${matchId};`;
  const matchDetails = await database.get(getMatchDetailsQuery);
  response.send(matchDetails);
});

//Get List Of Matches Of Player API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT
    match_details.match_id AS matchId,
    match_details.match,
    match_details.year
    FROM match_details
    NATURAL JOIN player_match_score
    WHERE player_match_score.player_id=${playerId};`;
  const playerMatches = await database.all(getPlayerMatchesQuery);
  response.send(playerMatches);
});

//Get List Of Players Of Specific Match API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const getMatchPlayersQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
    FROM player_details
    NATURAL JOIN player_match_score
    WHERE player_match_score.match_id= ${matchId};`;
  const playersOfTheMatch = await database.all(getMatchPlayersQuery);
  response.send(playersOfTheMatch);
});

//Get Statistics Of One Player API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerStatisticsQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM player_details
    INNER JOIN player_match_score ON
    player_details.player_id=player_match_score.player_id
    WHERE player_details.player_id= ${playerId};`;
  const playerStatistics = await database.get(getPlayerStatisticsQuery);
  response.send(playerStatistics);
});

module.exports = app;
