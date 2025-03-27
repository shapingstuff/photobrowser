import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Dashboard1 from "./dashboards/Dashboard1/Dashboard1";
import Dashboard2 from "./dashboards/Dashboard2/Dashboard2";
import Dashboard3 from "./dashboards/Dashboard3/Dashboard3";

import Frame1 from "./frames/Frame1/Frame1";
import Frame2 from "./frames/Frame2/Frame2";
import Frame3 from "./frames/Frame3/Frame3";

const Home = () => (
  <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
    <ul>
      <li><Link to="/dashboard-1">Dashboard 1</Link></li>
      <li><Link to="/dashboard-2">Dashboard 2</Link></li>
      <li><Link to="/dashboard-3">Dashboard 3</Link></li>
    </ul>

    <ul>
      <li><Link to="/frame-1">Frame 1</Link></li>
      <li><Link to="/frame-2">Frame 2</Link></li>
      <li><Link to="/frame-3">Frame 3</Link></li>
    </ul>
  </div>
);

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Dashboards */}
      <Route path="/dashboard-1" element={<Dashboard1 />} />
      <Route path="/dashboard-2" element={<Dashboard2 />} />
      <Route path="/dashboard-3" element={<Dashboard3 />} />

      {/* Frames */}
      <Route path="/frame-1" element={<Frame1 />} />
      <Route path="/frame-2" element={<Frame2 />} />
      <Route path="/frame-3" element={<Frame3 />} />
    </Routes>
  </Router>
);

export default App;