import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import mqtt from "mqtt";
import path from "path";
import { fileURLToPath } from "url";

// ESM-compatible __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

// Use EJS views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Route: Home
app.get("/", (req, res) => {
  res.render("index"); // views/index.ejs
});

// MQTT broker connection
const brokerUrl = "mqtt://broker.hivemq.com";
const mqttClient = mqtt.connect(brokerUrl);

// Topics: sensor/A to sensor/E
const sensorTopics = ["A", "B", "C", "D", "E"].map((s) => `sensor/${s}`);

// On MQTT connect
mqttClient.on("connect", () => {
  console.log("✅ Connected to MQTT broker");

  mqttClient.subscribe(sensorTopics, (err) => {
    if (err) {
      console.error("❌ Subscription error:", err);
    } else {
      console.log("📡 Subscribed to:", sensorTopics.join(", "));
    }
  });
});

// On MQTT message received
mqttClient.on("message", (topic, message) => {
  try {
    const sensorId = topic.split("/")[1];
    const parsed = JSON.parse(message.toString());

    const data = {
      sensor: sensorId,
      timestamp: parsed.timestamp,
      values: parsed.data // e.g., { voltage: 220, current: 3.5 }
    };

    const payload = JSON.stringify(data);

    // Broadcast to all connected WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });
  } catch (err) {
    console.error("❌ Error parsing MQTT message:", err.message);
  }
});

// On WebSocket connection
wss.on("connection", (ws) => {
  console.log("🔌 WebSocket client connected");

  // Optional: Send a "connected" ping so frontend can show "connected but waiting for data"
  ws.send(JSON.stringify({ type: "status", message: "connected" }));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
