import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./Dashboard6.css";

const WEBSOCKET_URL = "ws://192.168.68.56:8080";
const PHOTOPRISM_URL = "http://192.168.68.81:2342";

const Dashboard = () => {
  const wsRef = useRef(null);
  const [angle, setAngle] = useState(0);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [currentDateLabel, setCurrentDateLabel] = useState("");
  const lastTurnTime = useRef(Date.now());
  const recentTurns = useRef([]);

  // 📡 WebSocket connection
  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);
    wsRef.current = socket;

    socket.onopen = () => console.log("✅ WebSocket connected");

    socket.onclose = () => console.log("❌ WebSocket disconnected");

    socket.onerror = (err) => console.error("❌ WebSocket error:", err);

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "encoder") {
          const now = Date.now();
          const timeDiff = now - lastTurnTime.current;
          lastTurnTime.current = now;

          recentTurns.current.push(timeDiff);
          if (recentTurns.current.length > 3) {
            recentTurns.current.shift();
          }

          const avg = recentTurns.current.reduce((a, b) => a + b, 0) / recentTurns.current.length;

          let step = 3;
          if (avg < 100) step = 15;
          else if (avg < 200) step = 10;
          else if (avg < 350) step = 5;

          setAngle((prev) => {
            const newAngle = prev + data.value * step;
            const { after, before, display } = angleToMonthYear(newAngle);
            setCurrentDateLabel(display);
            fetchPhotosByMonth(after, before);
            return newAngle;
          });
        }
      } catch (err) {
        console.error("⚠️ Invalid WebSocket message:", err);
      }
    };

    return () => socket.close();
  }, []);

  // 🔁 Convert angle to month/year range
  const angleToMonthYear = (angle) => {
    const baseYear = 2019;
    const maxMonths = ((new Date().getFullYear() - baseYear + 1) * 12);
    const totalMonths = Math.floor((Math.max(0, angle) / 360) * maxMonths);

    const year = baseYear + Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    const paddedMonth = month.toString().padStart(2, "0");

    const after = `${year}-${paddedMonth}-01`;
    const before = month === 12 ? `${year + 1}-01-01` : `${year}-${(month + 1).toString().padStart(2, "0")}-01`;

    const display = `${new Date(year, month - 1).toLocaleString("default", {
      month: "long",
    })} ${year}`;

    return { after, before, display };
  };

  // 📷 Fetch PhotoPrism photos by month range
  const fetchPhotosByMonth = async (after, before) => {
    try {
      console.log(`🔍 Fetching from: ${after} → ${before}`);
      const response = await fetch(`${PHOTOPRISM_URL}/api/v1/photos?after=${after}&before=${before}&count=1`);
      const data = await response.json();
      if (data.length > 0) {
        const imageUrl = `${PHOTOPRISM_URL}/api/v1/t/${data[0].Hash}/public/fit_1920`;
        setCurrentPhoto(imageUrl);
        sendToFrame(imageUrl);
      } else {
        console.log("📭 No photos found for this range");
      }
    } catch (error) {
      console.error("❌ Error fetching photos:", error);
    }
  };

  // 📤 Send photo to frame via WebSocket
  const sendToFrame = (url, retry = 0) => {
    const ws = wsRef.current;

    if (!ws) {
      console.warn("⚠️ WebSocket is null");
      return;
    }

    if (ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type: "image", url });
      ws.send(message);
      console.log("📩 Sent image to frame:", url);
    } else if (ws.readyState === WebSocket.CONNECTING && retry < 5) {
      setTimeout(() => sendToFrame(url, retry + 1), 200);
    } else {
      console.warn("⚠️ WebSocket not ready. State:", ws.readyState);
    }
  };

  return (
    <div className="round-display">
      {/* Rotating Line */}
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
          zIndex: 10,
        }}
      />

      {/* Footer Text */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        width: "100%",
        textAlign: "center",
        color: "white",
        fontSize: "18px"
      }}>
        {currentPhoto
          ? `📅 Showing photo from ${currentDateLabel}`
          : "🌀 Turn the dial to explore by month"}
      </div>
    </div>
  );
};

export default Dashboard;
