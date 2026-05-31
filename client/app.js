const socket = io("http://localhost:3000");

const matchesContainer = document.getElementById("matches");

const charts = {};
const historyData = {};

socket.on("liveOdds", (matches) => {

    matches.forEach(match => {

        let card = document.getElementById(match.id);

        if (!card) {

            card = document.createElement("div");
            card.className = "card";
            card.id = match.id;

            card.innerHTML = `
                <div class="teams">
                    ${match.homeTeam} vs ${match.awayTeam}
                </div>

                <div class="odds">
                    <div class="odd homeOdd">
                        ${match.homeOdd}
                    </div>

                    <div class="odd awayOdd">
                        ${match.awayOdd}
                    </div>
                </div>

                <div class="chart-container">
                    <canvas id="chart-${match.id}"></canvas>
                </div>
            `;

            matchesContainer.appendChild(card);

            historyData[match.id] = {
                labels: [],
                home: [],
                away: []
            };

            const ctx = document
                .getElementById(`chart-${match.id}`)
                .getContext("2d");

            charts[match.id] = new Chart(ctx, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: "Home",
                            data: [],
                            borderColor: "#22c55e",
                            tension: 0.4
                        },
                        {
                            label: "Away",
                            data: [],
                            borderColor: "#ef4444",
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        const homeDiv = card.querySelector(".homeOdd");
        const awayDiv = card.querySelector(".awayOdd");

        homeDiv.textContent = match.homeOdd;
        awayDiv.textContent = match.awayOdd;

        homeDiv.className = `odd ${match.trend.home}`;
        awayDiv.className = `odd ${match.trend.away}`;

        const time = new Date().toLocaleTimeString();

        historyData[match.id].labels.push(time);
        historyData[match.id].home.push(match.homeOdd);
        historyData[match.id].away.push(match.awayOdd);

        if (historyData[match.id].labels.length > 10) {
            historyData[match.id].labels.shift();
            historyData[match.id].home.shift();
            historyData[match.id].away.shift();
        }

        charts[match.id].data.labels = historyData[match.id].labels;
        charts[match.id].data.datasets[0].data = historyData[match.id].home;
        charts[match.id].data.datasets[1].data = historyData[match.id].away;

        charts[match.id].update();

    });

});
