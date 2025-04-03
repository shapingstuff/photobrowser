import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { ReactComponent as ClockFace } from "./assets/ClockFace.svg";
import { ReactComponent as ClockHand } from "./assets/ClockHand.svg";
import "./Dashboard3.css";

const WEBSOCKET_URL = "ws://192.168.68.56:8080";

const Dashboard3 = () => {
  const positions = 5;
  const degreesPerStep = 360 / positions;

  const labels = [2019, 2020, 2021, 2022, 2023];
  const ages = [1, 2, 3, 4, 5];

  const [angle, setAngle] = useState(0);
  const [rotationCount, setRotationCount] = useState(0);
  const socketRef = useRef(null);
  const turnBuffer = useRef(0);
  const TURN_THRESHOLD = 2;

  const motionValue = useMotionValue(labels[0]);
  const [displayedValue, setDisplayedValue] = useState(labels[0]);

  const currentIndex = ((rotationCount % positions) + positions) % positions;

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

  // Rotate the hand
  useEffect(() => {
    setAngle(rotationCount * degreesPerStep);
  }, [rotationCount]);

  // Animate the number
  useEffect(() => {
    const newValue = labels[currentIndex];
    const controls = animate(motionValue, newValue, {
      duration: 0.8,
      onUpdate: (latest) => {
        setDisplayedValue(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [currentIndex]);

  return (
    <div className="round-display">
      {/* Clock face */}
      <ClockFace className="clock-face" />

      {/* Rotating hand */}
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
          filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.3))",
        }}
      >
        <ClockHand style={{ width: "100%", height: "100%" }} />
      </motion.div>

      {/* Animated year label */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "50%",
          transform: "translateX(-50%)",
          color: "black",
          textAlign: "center",
          fontWeight: "bold",
          zIndex: 5,
          filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.3))",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "0.3rem" }}>
          {ages[currentIndex]}th
        </div>
        <div style={{ fontSize: "3rem" }}>
          {displayedValue}
        </div>
      </div>
    </div>
  );
};

export default Dashboard3;