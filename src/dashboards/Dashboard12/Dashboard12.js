import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ReactComponent as TapeSVG } from "./assets/Tape.svg";
import "./Dashboard12.css";

const WEBSOCKET_URL = "ws://192.168.68.56:8080";

const DashboardTimeline = () => {
  const wsRef = useRef(null);
  const [offsetY, setOffsetY] = useState(300); // Currently aligns middle and this is an off set
  const recentTurns = useRef([]);
  const lastTurnTime = useRef(Date.now());

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "encoder") {
          const now = Date.now();
          const timeDiff = now - lastTurnTime.current;
          lastTurnTime.current = now;

          recentTurns.current.push(timeDiff);
          if (recentTurns.current.length > 3) recentTurns.current.shift();

          const avg = recentTurns.current.reduce((a, b) => a + b, 0) / recentTurns.current.length;
          let step = 3;
          if (avg < 100) step = 15;
          else if (avg < 200) step = 10;
          else if (avg < 350) step = 5;

          setOffsetY((prev) => prev + data.value * step);
        }
      } catch (err) {
        console.error("Invalid WebSocket message", err);
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div className="round-display timeline">
      <motion.div
        className="timeline-track"
        animate={{ y: offsetY }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        style={{ position: 'absolute', bottom: 0, left: '30%', transform: 'translateX(-50%)' }}
      >
        <TapeSVG />
      </motion.div>
    </div>
  );
};

export default DashboardTimeline;
