import React, { useState, useEffect } from "react";

const WEBSOCKET_URL = "ws://192.168.68.56:8080"; // WebSocket for sending data
const PHOTOPRISM_URL = "http://192.168.68.81:2342"; // PhotoPrism API

const Dashboard = () => {
  const [photos, setPhotos] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);
    setWs(socket);

    socket.onopen = () => console.log("✅ Connected to WebSocket server");

    return () => socket.close();
  }, []);

  // ✅ Fetch photos from PhotoPrism
  const fetchPhotos = async () => {
    try {
      const response = await fetch(`${PHOTOPRISM_URL}/api/v1/photos?count=20`);
      const data = await response.json();

      const images = data.map(photo => ({
        id: photo.Hash,
        url: `${PHOTOPRISM_URL}/api/v1/t/${photo.Hash}/public/fit_1920`
      }));

      setPhotos(images);
    } catch (error) {
      console.error("❌ Error fetching images:", error);
    }
  };

  // ✅ Send selected image to WebSocket (for Frame.js)
  const sendToFrame = (imageUrl) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const jsonMessage = JSON.stringify({ type: "image", url: imageUrl });
      ws.send(jsonMessage);
      console.log(`📩 Sent image: ${imageUrl}`);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={fetchPhotos}>Load Photos</button>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
        {photos.map(photo => (
          <img
            key={photo.id}
            src={photo.url}
            alt="Photo"
            width="150"
            style={{ cursor: "pointer", borderRadius: "8px" }}
            onClick={() => sendToFrame(photo.url)}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;