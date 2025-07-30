//
// // get sensor name
// let sensor_name = "Select a sensor"
// let sensorTitle = document.querySelector(".sensor-title")
//
// function updateDashboard(){
//     sensorTitle.textContent = sensor_name
// }
//
// const sensors = document.querySelectorAll('.sensor-btn')
// sensors.forEach(n=>{
//     n.addEventListener('click',()=>{
//         sensor_name = n.textContent
//         updateDashboard()
//     })
//
// })
//
//
//
// // control responsiveness
// const hamburger = document.querySelector('.hamburger');
// const mobileMenu = document.querySelector('.mobile-menu');
//
// hamburger.addEventListener('click', () => {
//     mobileMenu.classList.toggle('active');
// });
//
//
// document.querySelectorAll('.mobile-menu a, .mobile-menu .sensor-btn').forEach(item => {
//     item.addEventListener('click', () => {
//         mobileMenu.classList.remove('active');
//     });
// });






// // ============ SELECT DOM ELEMENTS ============
// let sensor_name = "Select a sensor";
// const sensorTitle = document.querySelector(".sensor-title");
// const cardsSection = document.querySelector(".cards-section");
// const ctx = document.getElementById("sensorChart").getContext("2d");

// let sensorChart; // Chart.js instance

// // ============ FETCH & UPDATE FUNCTIONS ============

// // Generate card HTML for each parameter
// function createCardHTML(label, value) {
//     return `
//         <div class="card">
//             <div class="icon-circle">${label.charAt(0).toUpperCase()}</div>
//             <div class="label">${label.toUpperCase()}</div>
//             <div class="value">${value}<span>${getUnit(label)}</span></div>
//             <div class="subtext">current ${label}</div>
//         </div>
//     `;
// }

// // Optional: assign units to parameters
// function getUnit(param) {
//     const units = {
//         temperature: "°C",
//         voltage: "V",
//         frequency: "Hz",
//         current: "A",
//         humidity: "%",
//         light: "lx",
//         pressure: "hPa",
//         altitude: "m",
//         gas: "ppm",
//         smoke: "%",
//         co2: "ppm"
//     };
//     return units[param.toLowerCase()] || "";
// }

// // Fetch sensor data from backend
// async function fetchSensorData(sensorID) {
//     try {
//         const response = await fetch(`http://localhost:3000/api/sensor/${sensorID}`);
//         const data = await response.json();
//         updateDashboard(data);
//     } catch (err) {
//         console.error("Failed to fetch sensor data:", err);
//     }
// }

// ============ UPDATE UI ============

function updateDashboard(data) {
    // 1. Update title
    sensor_name = data.name;
    sensorTitle.textContent = sensor_name;

    // 2. Update cards
    cardsSection.innerHTML = ""; // Clear previous
    for (const [param, value] of Object.entries(data.parameters)) {
        cardsSection.innerHTML += createCardHTML(param, value);
    }

    // 3. Update chart
    updateChart(data.history);
}

// ============ UPDATE CHART ============

function updateChart(historyData) {
    const labels = historyData.labels;
    const datasets = Object.entries(historyData)
        .filter(([key]) => key !== "labels")
        .map(([param, values], idx) => ({
            label: param.toUpperCase(),
            data: values,
            borderColor: getColor(idx),
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.3
        }));

    if (sensorChart) {
        sensorChart.data.labels = labels;
        sensorChart.data.datasets = datasets;
        sensorChart.update();
    } else {
        sensorChart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "top"
                    },
                    title: {
                        display: true,
                        text: "Sensor Parameter History"
                    }
                }
            }
        });
    }
}

// Choose distinct colors
function getColor(index) {
    const colors = [
        "#007bff", "#28a745", "#ffc107",
        "#dc3545", "#6f42c1", "#17a2b8",
        "#e83e8c", "#20c997"
    ];
    return colors[index % colors.length];
}

// ============ SETUP EVENT LISTENERS ============

// Sidebar and mobile sensor buttons
const sensors = document.querySelectorAll(".sensor-btn");
sensors.forEach(btn => {
    btn.addEventListener("click", () => {
        const sensorID = btn.textContent.trim().split(" ")[1]; // e.g., A from "Sensor A"
        fetchSensorData(sensorID);

        mobileMenu.classList.remove("active"); // Hide mobile menu if open
    });
});

// Responsive mobile menu
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





