import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ReactComponent as ClockFace } from "./assets/ClockFace.svg";
import { ReactComponent as ClockHand } from "./assets/ClockHand.svg";
import "./Dashboard2.css";

const WEBSOCKET_URL = "ws://192.168.68.56:8080";

const Dashboard2 = () => {
  const positions = 5; // Number of snap points (e.g., circles)
  const degreesPerStep = 360 / positions;

  const [angle, setAngle] = useState(0);
  const [rotationCount, setRotationCount] = useState(0);
  const socketRef = useRef(null);
  const turnBuffer = useRef(0);
  const TURN_THRESHOLD = 2; // Adjust to reduce encoder sensitivity

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "encoder") {
          turnBuffer.current += data.value;

          if (Math.abs(turnBuffer.current) >= TURN_THRESHOLD) {
            const direction = Math.sign(turnBuffer.current);
            setRotationCount((prev) => prev + direction);
            turnBuffer.current = 0;
          }
        }
      } catch (err) {
        console.error("WebSocket error", err);
      }
    };

    return () => socket.close();
  }, []);

  // Update angle whenever rotationCount changes
  useEffect(() => {
    setAngle(rotationCount * degreesPerStep);
  }, [rotationCount]);

  // Calculate a clean looping index 1–5
  const currentIndex = ((rotationCount % positions) + positions) % positions + 1;

  return (
    <div className="round-display">
      {/* SVG Clock Face */}
      <ClockFace className="clock-face" />

      {/* Rotating Hand */}
      <motion.div
        animate={{ rotate: angle }}
        transition={{ type: "spring", stiffness: 80, damping: 5 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transformOrigin: "center center",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <ClockHand style={{ width: "100%", height: "100%" }} />
      </motion.div>

      {/* Label behind the hand */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translateX(-50%)",
          color: "white",
          fontSize: "2rem",
          fontWeight: "bold",
          textAlign: "center",
          zIndex: 5,
        }}
      >
        Index {currentIndex}
      </div>

      {/* Center yellow dot */}
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
          zIndex: 15,
        }}
      />
    </div>
  );
};

export default Dashboard2;