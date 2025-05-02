import React, { useEffect, useState, useRef } from "react";
import "./Frame1.css";

const WEBSOCKET_URL = "ws://192.168.68.90:8080";

const Frame = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");
  const lastUrlRef = useRef(""); // 🔁 Use a ref to track last URL

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => console.log("✅ Connected to WebSocket server");

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "image" && data.url) {
          if (data.url !== lastUrlRef.current) {
            console.log("🖼️ Displaying new image:", data.url);
            lastUrlRef.current = data.url;
            setImageUrl(data.url);
          } else {
            console.log("🔁 Duplicate image, not updating.");
          }
          setAlbumTitle(data.albumTitle || "");
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
        <>
          <img
            src={imageUrl}
            alt="Slideshow"
            className="fullscreen-image"
          />
          <div className="album-title-overlay">{albumTitle}</div>
        </>
      ) : (
        <p className="waiting-text">Waiting for an image...</p>
      )}
    </div>
  );
};

export default Frame;