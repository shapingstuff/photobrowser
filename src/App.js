import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./Dashboard";
import Frame from "./Frame";

function App() {
  return (
    <Router>
      <div>
        <nav>
          <Link to="/dashboard">Dashboard</Link> | <Link to="/frame">Frame</Link>
        </nav>

        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/frame" element={<Frame />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;