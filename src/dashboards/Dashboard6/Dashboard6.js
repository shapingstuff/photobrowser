import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./Dashboard6.css";

const WEBSOCKET_URL = "ws://192.168.68.56:8080";
const PHOTOPRISM_URL = "http://192.168.68.81:2342";

const Dashboard = () => {
  const wsRef = useRef(null);
  const [angle, setAngle] = useState(0);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const lastTurnTime = useRef(Date.now());
  const recentTurns = useRef([]);

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);
    wsRef.current = socket; // ✅ Assign ref so sendToFrame has access
    console.log("✅ WebSocket created");

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
    };

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

          setAngle(prev => {
            const newAngle = prev + data.value * step;
            const date = angleToDate(newAngle);
            fetchPhotosByDate(date);
            return newAngle;
          });
        }
      } catch (err) {
        console.error("❌ Invalid WebSocket message", err);
      }
    };

    return () => socket.close();
  }, []);

  const angleToDate = (angle) => {
    const baseYear = 2015;
    const maxYears = 10;
    const clampedAngle = Math.max(0, Math.min(angle, 360));
    const yearOffset = Math.floor((clampedAngle / 360) * maxYears);
    const year = baseYear + yearOffset;
    return `${year}-01-01`;
  };

  const fetchPhotosByDate = async (date) => {
    try {
      console.log("🔍 Fetching photo from date:", date);
      const response = await fetch(`${PHOTOPRISM_URL}/api/v1/photos?after=${date}&count=1`);
      const data = await response.json();
      if (data.length > 0) {
        const imageUrl = `${PHOTOPRISM_URL}/api/v1/t/${data[0].Hash}/public/fit_1920`;
        console.log("🖼️ Photo URL:", imageUrl);
        setCurrentPhoto(imageUrl);
        sendToFrame(imageUrl);
      }
    } catch (error) {
      console.error("❌ Error fetching image by date:", error);
    }
  };

  const sendToFrame = (url, retry = 0) => {
    const ws = wsRef.current;

    if (!ws) {
      console.warn("⚠️ WebSocket instance is null (retry", retry, ")");
      if (retry < 5) {
        setTimeout(() => sendToFrame(url, retry + 1), 200);
      }
      return;
    }

    console.log("🔍 WebSocket readyState:", ws.readyState);

    switch (ws.readyState) {
      case WebSocket.OPEN:
        try {
          const message = JSON.stringify({ type: "image", url });
          ws.send(message);
          console.log("📩 Sent image to frame:", url);
        } catch (err) {
          console.error("❌ Error while sending WebSocket message:", err);
        }
        break;
      case WebSocket.CONNECTING:
        console.warn("🕒 WebSocket is CONNECTING. Retrying...");
        if (retry < 5) {
          setTimeout(() => sendToFrame(url, retry + 1), 200);
        }
        break;
      default:
        console.warn("⚠️ WebSocket not ready. State:", ws.readyState);
    }
  };

  return (
    <div className="round-display">
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

      <div style={{
        position: "absolute",
        bottom: "20px",
        width: "100%",
        textAlign: "center",
        color: "white",
        fontSize: "18px"
      }}>
        {currentPhoto ? `📅 Showing photo from approx ${angleToDate(angle)}` : "🌀 Turn the dial to explore photos by year"}
      </div>
    </div>
  );
};

export default Dashboard;