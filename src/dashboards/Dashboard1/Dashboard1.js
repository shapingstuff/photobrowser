import React, { useState, useEffect } from "react";
import "./Dashboard1.css"; // your circular layout

const WEBSOCKET_URL = "ws://192.168.68.56:8080"; // replace with your server if needed

const Dashboard1 = () => {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "encoder") {
          // Rotate by fixed steps (e.g., 15° per tick)
          setAngle(prev => prev + data.value * 1);
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
          width: "4px",
          height: "35%",
          backgroundColor: "white",
          transform: `translate(-50%, -100%) rotate(${angle}deg)`,
          transformOrigin: "bottom center",
          transition: "transform 0.2s ease-out",
        }}
      />
    </div>
  );
};

export default Dashboard1;