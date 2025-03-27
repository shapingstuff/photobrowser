import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./Dashboard1.css";

const WEBSOCKET_URL = "ws://192.168.68.56:8080";

const Dashboard1 = () => {
  const [angle, setAngle] = useState(0);
  const lastTurnTime = useRef(Date.now());
  const recentTurns = useRef([]);

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onmessage = (event) => {
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

          setAngle((prev) => prev + data.value * step);
        }
      } catch (err) {
        console.error("Invalid WebSocket message", err);
      }
    };

    return () => socket.close();
  }, []);

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
        height: "35vh", // try using vh for more consistent scale
        backgroundColor: "white",
        transformOrigin: "bottom center",
      }}
    />
  </div>
</div>
  );
};

export default Dashboard1;