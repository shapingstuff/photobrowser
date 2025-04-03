import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./Dashboard8.css";

const WEBSOCKET_URL = "ws://192.168.68.56:8080";
const PHOTOPRISM_URL = "http://192.168.68.81:2342";

const Dashboard = () => {
  const wsRef = useRef(null);
  const [angle, setAngle] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date("2021-01-01"));
  const [lastTurnTime, setLastTurnTime] = useState(Date.now());
  const recentTurns = useRef([]);

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);
    wsRef.current = socket;

    socket.onopen = () => console.log("✅ Connected to WebSocket server");
    socket.onclose = () => console.warn("❌ WebSocket closed");
    socket.onerror = (e) => console.error("🚨 WebSocket error:", e);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "encoder") {
          const now = Date.now();
          const timeDiff = now - lastTurnTime;
          setLastTurnTime(now);

          recentTurns.current.push(timeDiff);
          if (recentTurns.current.length > 3) recentTurns.current.shift();

          const avg = recentTurns.current.reduce((a, b) => a + b, 0) / recentTurns.current.length;
          const direction = data.value > 0 ? 1 : -1;
          const step = 1;

          updatePhotoIndex(direction * step);
        }
      } catch (err) {
        console.error("❌ Invalid WebSocket message", err);
      }
    };

    return () => socket.close();
  }, [lastTurnTime]);

  const updatePhotoIndex = (delta) => {
    if (photos.length === 0) return;

    let newIndex = currentPhotoIndex + delta;

    if (newIndex >= photos.length) {
      advanceDate(1);
      return;
    } else if (newIndex < 0) {
      advanceDate(-1);
      return;
    }

    setCurrentPhotoIndex(newIndex);
    const newAngle = (newIndex / photos.length) * 360;
    setAngle(newAngle);
    sendToFrame(photos[newIndex].url);
  };

  const advanceDate = (days) => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + days);
    setCurrentDate(next);
  };

  useEffect(() => {
    fetchPhotosByDate(currentDate);
  }, [currentDate]);

  const fetchPhotosByDate = async (date) => {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    const after = date.toISOString().split("T")[0];
    const before = nextDay.toISOString().split("T")[0];

    try {
      const response = await fetch(`${PHOTOPRISM_URL}/api/v1/photos?after=${after}&before=${before}&count=100`);
      const data = await response.json();

      const images = data.map(photo => ({
        id: photo.Hash,
        url: `${PHOTOPRISM_URL}/api/v1/t/${photo.Hash}/public/fit_1920`,
      }));

      setPhotos(images);
      setCurrentPhotoIndex(0);

      if (images.length > 0) {
        setAngle(0);
        sendToFrame(images[0].url);
      }
    } catch (error) {
      console.error("❌ Error fetching photos:", error);
    }
  };

  const sendToFrame = (url) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "image", url }));
    } else {
      console.warn("⚠️ WebSocket not ready. Cannot send image.");
    }
  };

  const displayDate = currentDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="round-display">
      {/* Rotating Dial */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -100%)",
          transformOrigin: "bottom center",
        }}
      >
        <motion.div
          animate={{ rotate: angle }}
          transition={{ type: "spring", stiffness: 140, damping: 15 }}
          style={{
            width: "4px",
            height: "35vh",
            backgroundColor: "white",
            transformOrigin: "bottom center",
          }}
        />
      </div>

      {/* Center Dot */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "20px",
          height: "20px",
          backgroundColor: "yellow",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 5,
        }}
      />

      {/* Evenly spaced tick markers for each photo */}
      {photos.map((_, index) => {
        const dotAngle = (index / photos.length) * 360;
        const radius = 46;
        const x = 50 + radius * Math.cos((dotAngle - 90) * (Math.PI / 180));
        const y = 50 + radius * Math.sin((dotAngle - 90) * (Math.PI / 180));

        return (
          <div
            key={`tick-${index}`}
            style={{
              position: "absolute",
              width: "10px",
              height: "10px",
              backgroundColor: "red",
              boxShadow: "0 0 4px rgba(0,0,0,0.6)",
              borderRadius: "50%",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 4,
            }}
          />
        );
      })}

      {/* Footer date */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          width: "100%",
          textAlign: "center",
          color: "white",
          fontSize: "18px",
        }}
      >
        {photos.length > 0 ? `📅 ${displayDate}` : "🌀 Turn to explore photos"}
      </div>
    </div>
  );
};

export default Dashboard;
