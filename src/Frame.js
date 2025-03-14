import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // ✅ Import Motion
import "./Frame.css"; // ✅ Import CSS

const WEBSOCKET_URL = "ws://192.168.68.56:8080"; // WebSocket server

const Frame = () => {
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => console.log("✅ Connected to WebSocket server");

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "image") {
          console.log(`📩 Received image: ${data.url}`);
          setImageUrl(data.url);
        } else {
          console.warn("❌ Unsupported message type:", data);
        }
      } catch (error) {
        console.error("❌ Error parsing JSON:", error);
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div className="frame-container">
      <AnimatePresence>
        {imageUrl ? (
          <motion.img
            key={imageUrl} // ✅ Ensure each image transition is unique
            src={imageUrl}
            alt="Slideshow"
            className="fullscreen-image"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1 }} // ✅ Smooth fade transition
          />
        ) : (
          <motion.p
            className="waiting-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Waiting for an image...
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Frame;