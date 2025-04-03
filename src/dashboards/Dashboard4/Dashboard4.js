import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import "./Dashboard4.css";
import { ReactComponent as ClockFace } from "./assets/ClockFace.svg";
import { ReactComponent as HeightMarker } from "./assets/HeightMarker.svg";

const WEBSOCKET_URL = "ws://192.168.68.56:8080";

const Dashboard4 = () => {
    const [position, setPosition] = useState(0); // ranges 0–130
    const socketRef = useRef(null);
    const turnBuffer = useRef(0);
    const TURN_THRESHOLD = 1;

    const min = 0;
    const max = 130;
    const heightPx = 600; // how much vertical movement

    useEffect(() => {
        const socket = new WebSocket(WEBSOCKET_URL);
        socketRef.current = socket;

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "encoder") {
                    turnBuffer.current -= data.value;
                    if (Math.abs(turnBuffer.current) >= TURN_THRESHOLD) {
                        const direction = Math.sign(turnBuffer.current);
                        setPosition(prev =>
                            Math.max(min, Math.min(max, prev + direction * 1))
                        );
                        turnBuffer.current = 0;
                    }
                }
            } catch (err) {
                console.error("WebSocket error", err);
            }
        };

        return () => socket.close();
    }, []);

    const lines = Array.from({ length: 11 }); // 11 horizontal lines
    const stepHeight = heightPx / (lines.length - 1);
    const yOffset = (position / (max - min)) * heightPx;

    return (
        <div className="round-display">
            <ClockFace className="clock-face" />
            {/* Sliding Height Display */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    right: "10%",
                    transform: "translateY(-50%)",
                    width: "120px",
                    height: "80px", // visible window
                    overflow: "hidden",
                    border: "2px solid white",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    zIndex: 20,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <motion.div
                    animate={{ y: -((position) * 80) + (max * 80) / 2 }}
                    transition={{ type: "spring", stiffness: 100, damping: 12 }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    {/* Render 0 to 130 cm */}
                    {Array.from({ length: 131 }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                height: "80px",
                                fontSize: "3rem",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {i}
                        </div>
                    ))}
                </motion.div>
            </div>
            {/* CM Label */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    right: "2%",
                    transform: "translateY(-50%)",
                    fontSize: "2.5rem",
                    color: "white",
                    fontWeight: "bold",
                    zIndex: 21,
                }}
            >
                cm
            </div>

            {/* Moving Rectangle (marker) */}
            <motion.div
  animate={{ y: -yOffset }}
  transition={{
    type: "spring",
    stiffness: 8,
    damping: 5,
    mass: 2,
    bounce: 0.5,
  }}
  style={{
    width: "100%", height: "100%",
    position: "absolute",
    top: "0%",
    left: "0%",
    transform: `translate(0%, 0%) translateY(${-yOffset}px)`,
    zIndex: 10,
    pointerEvents: "none",
  }}
>
  <HeightMarker />
</motion.div>
        </div>
    );
};

export default Dashboard4;
