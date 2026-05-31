const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_KEY;

const previousOdds = {};

async function fetchOdds() {
    try {
        const response = await axios.get(
            "https://api.the-odds-api.com/v4/sports/soccer_epl/odds",
            {
                params: {
                    apiKey: API_KEY,
                    regions: "eu",
                    markets: "h2h",
                    oddsFormat: "decimal"
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error(error.message);
        return [];
    }
}

function compareOdds(matchId, homeOdd, awayOdd) {
    let trend = { home: "same", away: "same" };

    if (previousOdds[matchId]) {
        if (homeOdd > previousOdds[matchId].home) trend.home = "up";
        if (homeOdd < previousOdds[matchId].home) trend.home = "down";
        if (awayOdd > previousOdds[matchId].away) trend.away = "up";
        if (awayOdd < previousOdds[matchId].away) trend.away = "down";
    }

    previousOdds[matchId] = { home: homeOdd, away: awayOdd };

    return trend;
}

io.on("connection", (socket) => {
    console.log("Utilisateur connecté");

    const interval = setInterval(async () => {
        const matches = await fetchOdds();

        const formatted = matches.map(match => {
            const bookmaker = match.bookmakers?.[0];
            if (!bookmaker) return null;

            const market = bookmaker.markets?.[0];
            if (!market) return null;

            const outcomes = market.outcomes;

            const homeOdd = outcomes[0]?.price || 0;
            const awayOdd = outcomes[1]?.price || 0;

            const trend = compareOdds(match.id, homeOdd, awayOdd);

            return {
                id: match.id,
                homeTeam: match.home_team,
                awayTeam: match.away_team,
                homeOdd,
                awayOdd,
                trend,
                commenceTime: match.commence_time
            };
        }).filter(Boolean);

        socket.emit("liveOdds", formatted);

    }, 5000);

    socket.on("disconnect", () => {
        clearInterval(interval);
        console.log("Utilisateur déconnecté");
    });
});

server.listen(PORT, () => {
    console.log("Serveur lancé");
});
