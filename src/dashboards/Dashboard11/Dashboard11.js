import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import "./Dashboard11.css";

const WEBSOCKET_URL = "ws://192.168.68.56:8080";

// Generate all months between April 2019 and April 2025
const generateTimelineMarkers = () => {
  const startDate = new Date(2019, 3, 25); // April 25, 2019
  const endDate = new Date(2025, 3, 25);
  const markers = [];

  let current = new Date(startDate);
  let age = 0;

  while (current <= endDate) {
    const isBirthday = current.getDate() === 25 && current.getMonth() === 3;
    markers.push({
      label: isBirthday ? `Age ${age++}` : null,
      date: current.toISOString().split("T")[0],
      isBirthday,
    });
    current.setMonth(current.getMonth() + 1);
  }

  return markers;
};

const DashboardTimeline = () => {
  const wsRef = useRef(null);
  const [offsetY, setOffsetY] = useState(0);
  const [visibleLabel, setVisibleLabel] = useState(null);
  const recentTurns = useRef([]);
  const lastTurnTime = useRef(Date.now());
  const markers = generateTimelineMarkers();

  const markerSpacing = 90;
  const centerIndex = markers.length - 1;
  const initialOffset = -(centerIndex * markerSpacing) / 2;

  useEffect(() => {
    setOffsetY(initialOffset);

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

  useEffect(() => {
    const index = Math.round(-offsetY / markerSpacing);
    const marker = markers[index];
    if (marker?.isBirthday) {
      setVisibleLabel(marker.label);
    } else {
      setVisibleLabel(null);
    }
  }, [offsetY]);

  return (
    <div className="round-display timeline">
      {/* Timeline */}
      <motion.div
        className="timeline-track"
        animate={{ y: offsetY }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {markers.map((marker, index) => (
          <div
            key={index}
            className="timeline-marker"
            style={{ marginBottom: `${markerSpacing}px` }}
          >
            {marker.isBirthday ? (
              <>
                <div className="marker-circle"></div>
              </>
            ) : (
              <div className="marker-line"></div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Age Label floating at center left */}
      {visibleLabel && (
        <div
          style={{
            position: "absolute",
            left: "30px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "white",
            fontSize: "2rem",
            fontWeight: "bold",
            zIndex: 10,
          }}
        >
          {visibleLabel}
        </div>
      )}
    </div>
  );
};

export default DashboardTimeline;
