const mqtt = require("mqtt");

const mqttClient = mqtt.connect("mqtt://localhost:1883");  // or your Pi IP

mqttClient.on("connect", () => {
  console.log("📡 Connected to MQTT broker");
  mqttClient.subscribe("tape/position", (err) => {
    if (err) {
      console.error("❌ Subscribe error:", err);
    } else {
      console.log("✅ Subscribed to tape/position");
    }
  });
});

mqttClient.on("message", (topic, message) => {
  console.log(`📩 MQTT message on topic "${topic}": ${message.toString()}`);
});