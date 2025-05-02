import React, { useEffect, useState } from "react";
import "./Frame1.css"; // ✅ Import CSS

const WEBSOCKET_URL = "ws://192.168.68.90:8080"; // WebSocket server

const Frame = () => {
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => console.log("✅ Connected to WebSocket server");

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "image" && data.url) {
          console.log("🖼️ Displaying image:", data.url);
          setImageUrl(data.url);
        } else {
          console.warn("⚠️ Unexpected data structure:", data);
        }
      } catch (err) {
        console.error("❌ Failed to parse JSON:", event.data);
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div className="frame-container">
      {imageUrl ? (
        <img
          key={imageUrl}
          src={imageUrl}
          alt="Slideshow"
          className="fullscreen-image"
        />
      ) : (
        <p className="waiting-text">Waiting for an image...</p>
      )}
    </div>
  );
};

export default Frame;