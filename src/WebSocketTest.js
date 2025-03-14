import React, { useEffect, useState } from "react";

const WEBSOCKET_URL = "ws://192.168.68.56:8080"; // Use your Raspberry Pi's IP

const WebSocketTest = () => {
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);
    setWs(socket);

    socket.onopen = () => {
      console.log("✅ Connected to WebSocket server");
    };

    socket.onmessage = (event) => {
      console.log("📩 Received from server:", event.data);
      setMessage(event.data); // Display message from server
    };

    socket.onclose = () => {
      console.log("❌ Disconnected from WebSocket server");
    };

    return () => socket.close();
  }, []);

  const sendMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send("Hello from frontend!");
    }
  };

  return (
    <div>
      <h1>WebSocket Test</h1>
      <p>Server says: {message}</p>
      <button onClick={sendMessage}>Send Message</button>
    </div>
  );
};

export default WebSocketTest;