import React, { useState, useEffect } from "react";
import "./Dashboard1.css"; // Import the CSS file

const WEBSOCKET_URL = "ws://192.168.68.56:8080"; // WebSocket for sending data on the dashboard
const PHOTOPRISM_URL = "http://192.168.68.81:2342"; // PhotoPrism API

const Dashboard = () => {
  const [photos, setPhotos] = useState([]);
  const [ws, setWs] = useState(null);
  const [currentText, setCurrentText] = useState("Welcome! Tap to Load Photos");

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);
    setWs(socket);
  
    socket.onopen = () => console.log("✅ Connected to WebSocket server");
  
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 Received from encoder:", data);
  
        if (data.type === "encoder") {
          setCurrentText(`Encoder moved: ${data.value}`);
        }
  
        if (data.type === "button") {
          setCurrentText("🔘 Button Pressed");
        }
      } catch (error) {
        console.error("❌ Failed to parse WebSocket message:", error);
      }
    };
  
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
      setCurrentText("Select an Image Below");
    } catch (error) {
      console.error("❌ Error fetching images:", error);
      setCurrentText("Error Loading Photos");
    }
  };

  // ✅ Send selected image to WebSocket (for Frame.js)
  const sendToFrame = (imageUrl) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const jsonMessage = JSON.stringify({ type: "image", url: imageUrl });
      ws.send(jsonMessage);
      console.log(`📩 Sent image: ${imageUrl}`);
      setCurrentText("Image Sent!");
    }
  };

  return (
    <div className="round-display">
      <div className="round-text">{currentText}</div>
      {photos.length === 0 ? (
        <button onClick={fetchPhotos} style={{ position: "absolute", bottom: "20px", padding: "10px 20px" }}>
          Load Photos
        </button>
      ) : (
        <div style={{ position: "absolute", bottom: "20px", display: "flex", gap: "10px", overflowX: "auto" }}>
          {photos.map(photo => (
            <img
              key={photo.id}
              src={photo.url}
              alt="Photo"
              width="80"
              height="80"
              style={{ borderRadius: "50%", cursor: "pointer", objectFit: "cover" }}
              onClick={() => sendToFrame(photo.url)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
