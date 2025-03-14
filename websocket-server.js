const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080, host: "0.0.0.0" });

wss.on("connection", (ws) => {
  console.log("✅ New client connected");

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log("📩 Received JSON:", parsedMessage);

      // ✅ Broadcast JSON to all clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(parsedMessage));
        }
      });
    } catch (error) {
      console.error("❌ Invalid JSON received:", error);
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});

console.log("🚀 WebSocket server running on ws://0.0.0.0:8080");