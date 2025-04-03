import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./Dashboard7.css";

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

  // 📡 WebSocket connection
  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);
    wsRef.current = socket;

    socket.onopen = () => console.log("✅ Connected to WebSocket server");
    socket.onclose = () => console.warn("❌ WebSocket connection closed");
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
          let step = 3;
          if (avg < 100) step = 15;
          else if (avg < 200) step = 10;
          else if (avg < 350) step = 5;

          updateAngle(data.value * step);
        }
      } catch (err) {
        console.error("Invalid WebSocket message", err);
      }
    };

    return () => socket.close();
  }, [lastTurnTime]);

  const updateAngle = (delta) => {
    setAngle((prev) => {
      let newAngle = prev + delta;
      if (newAngle >= 360) {
        newAngle = 0;
        advanceDate(1);
      } else if (newAngle < 0) {
        newAngle = 359;
        advanceDate(-1);
      } else {
        updateCurrentPhotoIndex(newAngle);
      }
      return newAngle;
    });
  };

  const updateCurrentPhotoIndex = (newAngle) => {
    if (photos.length === 0) {
      advanceDate(1);
      return;
    }

    const slice = 360 / photos.length;
    const index = Math.floor(newAngle / slice);

    if (index !== currentPhotoIndex) {
      setCurrentPhotoIndex(index);
      sendToFrame(photos[index].url);
    }
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
        TakenAt: photo.TakenAt
      }));

      setPhotos(images);
      setCurrentPhotoIndex(0);
      if (images.length > 0) sendToFrame(images[0].url);
    } catch (error) {
      console.error("❌ Error fetching photos:", error);
    }
  };

  const sendToFrame = (url) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type: "image", url });
      ws.send(message);
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
      {/* Dial Line */}
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
        }}
      />

      {/* Tick Markers for each photo time */}
      {photos.map((photo, i) => {
        if (!photo.TakenAt) return null;

        const date = new Date(photo.TakenAt);
        const totalMinutes = date.getHours() * 60 + date.getMinutes(); // 0–1439
        const angle = (totalMinutes / 1440) * 360;
        const radius = 45;

        const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180));
        const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180));

        return (
          <div
            key={photo.id}
            className="tick"
            style={{
              position: "absolute",
              width: "20px",
              height: "20px",
              backgroundColor: "red",
              borderRadius: "50%",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}

      {/* Footer */}
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