// Responsive menu toggle
const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");

hamburger.addEventListener("click", () => {
  mobileMenu.classList.toggle("active");
});

document.querySelectorAll(".mobile-menu a, .mobile-menu .sensor-btn").forEach(item => {
  item.addEventListener("click", () => {
    mobileMenu.classList.remove("active");
  });
});

const socket = new WebSocket(`wss://${window.location.host}`);
let currentSensor = "A";
let chart;
let chartData = {};
let chartLabels = [];

const sensorButtons = document.querySelectorAll(".sensor-btn");
const sensorTitle = document.getElementById("sensor-title");
const cardsContainer = document.getElementById("sensor-cards");
const chartContainer = document.getElementById("chartContainer");
const updateStatus = document.getElementById("update-status");
const updateStatusText = document.querySelector(".status-text");

// Color palette for variables
const colorMap = {
  voltage: "#f44336",
  current: "#2196f3",
  temperature: "#4caf50",
  humidity: "#ff9800",
  power: "#9c27b0"
};
let usedColors = new Set();

function getColorForVariable(variable) {
  if (colorMap[variable]) {
    usedColors.add(colorMap[variable]);
    return colorMap[variable];
  }

  const fallbackColors = [
    "#3f51b5", "#009688", "#e91e63", "#795548", "#607d8b", "#00bcd4", "#8bc34a"
  ];
  for (let color of fallbackColors) {
    if (!usedColors.has(color)) {
      usedColors.add(color);
      return color;
    }
  }

  return "#000000";
}

// Highlight the selected sensor in sidebar and mobile nav
function highlightSelectedSensor() {
  sensorButtons.forEach(btn => {
    const sensor = btn.textContent.trim().split(" ")[1];
    btn.classList.toggle("selected", sensor === currentSensor);
  });
}

// Clear and recreate chart
function resetChart() {
  chartData = {};
  chartLabels = [];
  usedColors.clear();

  if (chart) chart.destroy();
  chartContainer.innerHTML = `<canvas id="sensorChart"></canvas>`;
  const ctx = document.getElementById("sensorChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartLabels,
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: 'easeOutCubic'
      },
      scales: {
        x: {
          ticks: { autoSkip: true, maxTicksLimit: 10 }
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 2 }
        }
      },
      plugins: {
        legend: { display: true }
      }
    }
  });
}

// Render live sensor data cards
function updateCards(values) {
  cardsContainer.innerHTML = "";
  for (const [key, val] of Object.entries(values)) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="icon-circle">${key[0].toUpperCase()}</div>
      <div class="label">${key.toUpperCase()}</div>
      <div class="value">${val}<span>${getUnit(key)}</span></div>
      <div class="subtext">current ${key}</div>
    `;
    cardsContainer.appendChild(card);
  }
}

// Units for common variables
function getUnit(key) {
  const units = {
    voltage: "V",
    current: "A",
    temperature: "°C",
    humidity: "%",
    power: "W"
  };
  return units[key] || "";
}

// Show timestamp after data received
function showLastUpdatedTime(timestamp) {
  const time = new Date(timestamp).toLocaleTimeString();
  updateStatus.classList.remove("status-container");
  updateStatus.innerHTML = `Last updated: <strong>${time}</strong>`;
}

// Sensor switch logic
sensorButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const selected = btn.textContent.trim().split(" ")[1];
    if (selected === currentSensor) return;

    currentSensor = selected;
    sensorTitle.textContent = `Sensor ${selected}`;
    highlightSelectedSensor();
    resetChart();

    // Reset status spinner
    updateStatus.innerHTML = `
      <span class="spinner"></span>
      <span class="status-text">Waiting for data...</span>
    `;
    updateStatus.style.display = "flex";
  });
});

// WebSocket message handler
socket.addEventListener("message", event => {
  const msg = JSON.parse(event.data);
  if (msg.sensor !== currentSensor) return;

  const timestamp = new Date(msg.timestamp).toLocaleTimeString();
  if (!chartLabels.includes(timestamp)) chartLabels.push(timestamp);

  for (const [key, value] of Object.entries(msg.values)) {
    if (!chartData[key]) {
      chartData[key] = [];
      chart.data.datasets.push({
        label: key,
        data: [],
        fill: false,
        borderColor: getColorForVariable(key),
        tension: 0.3
      });
    }

    chartData[key].push(value);
    const dataset = chart.data.datasets.find(ds => ds.label === key);
    dataset.data = chartData[key].slice(-20);
  }

  chart.data.labels = chartLabels.slice(-20);
  chart.update();

  updateCards(msg.values);
  showLastUpdatedTime(msg.timestamp);
});

// Initial load setup
window.addEventListener("DOMContentLoaded", () => {
  sensorTitle.textContent = "Sensor A";
  highlightSelectedSensor();
  resetChart();

  updateStatus.innerHTML = `
    <span class="spinner"></span>
    <span class="status-text">Waiting for data...</span>
  `;
  updateStatus.style.display = "flex";
});
