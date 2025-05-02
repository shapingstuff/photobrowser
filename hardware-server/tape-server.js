// tape-server.js
const WebSocket = require("ws");
const mqtt = require("mqtt");
const fetch = require("node-fetch");

const PHOTOPRISM_API = "http://192.168.68.81:2342";
const mqttClient = mqtt.connect("mqtt://localhost:1883");

const wss = new WebSocket.Server({ port: 8080, host: "0.0.0.0" });
console.log("🚀 WebSocket server running on ws://0.0.0.0:8080");

let timeline = [];
let lastSentHash = null;

function parseTapeAlbums(albums) {
  return albums
    .filter(a => a.Description && a.Description.startsWith("TAPE|"))
    .map(a => {
      const parts = a.Description.split("|");
      if (parts.length < 6) return null;
      const [_, tapeId, type, title, color, index] = parts;
      return {
        tapeId,
        type,
        title,
        color,
        index: parseInt(index),
        uid: a.UID,
        photos: [],
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);
}

function getCurrentAlbum(cm) {
  for (let album of timeline) {
    const start = album.index;
    const end = start + album.photos.length - 1;
    if (cm >= start && cm <= end) return { album, photoIndex: cm - start };
  }
  return null;
}

async function fetchTapeTimeline() {
  try {
    const res = await fetch(`${PHOTOPRISM_API}/api/v1/albums?count=100`);
    const albums = await res.json();

    if (!Array.isArray(albums)) {
      console.error("❌ Unexpected album response:", albums);
      return;
    }

    timeline = parseTapeAlbums(albums);

    for (let album of timeline) {
      const res = await fetch(`${PHOTOPRISM_API}/api/v1/photos?album=${album.uid}&public=true&count=200`);
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn(`⚠️ Skipping album ${album.title}: photos response not an array`);
        console.warn("🔍 Response:", data);
        continue;
      }
      album.photos = data.map(p => ({ hash: p.Hash }));
    }

    console.log("📚 Timeline loaded with", timeline.length, "albums");
  } catch (err) {
    console.error("❌ Failed to fetch timeline:", err);
  }
}

wss.on("connection", (ws) => {
  console.log("✅ New client connected");

  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(message);
      console.log("📩 Received JSON:", parsed);

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(parsed));
        }
      });
    } catch (err) {
      console.error("❌ Invalid JSON received:", err);
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});

mqttClient.on("connect", () => {
  console.log("📡 MQTT connected");
  mqttClient.subscribe("tape/position");
  fetchTapeTimeline();
});

mqttClient.on("message", async (topic, message) => {
  if (topic === "tape/position") {
    const cm = parseInt(message.toString());
    console.log(`📏 Tape position: ${cm} cm`);

    const match = getCurrentAlbum(cm);
    if (!match) {
      console.log("⚠️ No album found at this position");
      return;
    }

    const { album, photoIndex } = match;
    const photo = album.photos[photoIndex];
    if (!photo) {
      console.log("⚠️ No photo at this cm position in album");
      return;
    }

    if (photo.hash === lastSentHash) {
      return; // Skip sending duplicate image
    }
    lastSentHash = photo.hash;

    const imageUrl = `${PHOTOPRISM_API}/api/v1/t/${photo.hash}/public/fit_1920`;

    const payload = {
      type: "image",
      url: imageUrl,
      albumTitle: album.title,
      color: album.color,
      cm,
    };

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(payload));
      }
    });

    console.log("🖼️ Sent image from album:", album.title, "→", imageUrl);
    mqttClient.publish("tape/led", JSON.stringify(colorToRGB(album.color)));
  }
});

function colorToRGB(colorName) {
  const colors = {
    red:     { r: 255, g: 0,   b: 0 },
    green:   { r: 0,   g: 255, b: 0 },
    blue:    { r: 0,   g: 0,   b: 255 },
    yellow:  { r: 255, g: 255, b: 0 },
    magenta: { r: 255, g: 0,   b: 255 },
    cyan:    { r: 0,   g: 255, b: 255 },
    white:   { r: 255, g: 255, b: 255 },
    orange:  { r: 255, g: 165, b: 0 },
    black:   { r: 0,   g: 0,   b: 0 }
  };
  return colors[colorName.toLowerCase()] || colors.white;
}
