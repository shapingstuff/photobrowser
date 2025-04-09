import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Dashboard1 from "./dashboards/Dashboard1/Dashboard1";
import Dashboard2 from "./dashboards/Dashboard2/Dashboard2";
import Dashboard3 from "./dashboards/Dashboard3/Dashboard3";
import Dashboard4 from "./dashboards/Dashboard4/Dashboard4";
import Dashboard5 from "./dashboards/Dashboard5/Dashboard5";
import Dashboard6 from "./dashboards/Dashboard6/Dashboard6";
import Dashboard7 from "./dashboards/Dashboard7/Dashboard7";
import Dashboard8 from "./dashboards/Dashboard8/Dashboard8";
import Dashboard9 from "./dashboards/Dashboard9/Dashboard9";
import Dashboard10 from "./dashboards/Dashboard10/Dashboard10";
import Dashboard11 from "./dashboards/Dashboard11/Dashboard11";
import Dashboard12 from "./dashboards/Dashboard12/Dashboard12";


import Frame1 from "./frames/Frame1/Frame1";
import Frame2 from "./frames/Frame2/Frame2";
import Frame3 from "./frames/Frame3/Frame3";

const Home = () => (
  <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
    <ul>
      <li><Link to="/dashboard-1">Dashboard 1</Link></li>
      <li><Link to="/dashboard-2">Dashboard 2</Link></li>
      <li><Link to="/dashboard-3">Dashboard 3</Link></li>
      <li><Link to="/dashboard-4">Dashboard 4</Link></li>
      <li><Link to="/dashboard-5">Dashboard 5</Link></li>
      <li><Link to="/dashboard-6">Dashboard 6</Link></li>
      <li><Link to="/dashboard-7">Dashboard 7</Link></li>
      <li><Link to="/dashboard-8">Dashboard 8</Link></li>
      <li><Link to="/dashboard-9">Dashboard 9</Link></li>
      <li><Link to="/dashboard-10">Dashboard 10</Link></li>
      <li><Link to="/dashboard-11">Dashboard 11</Link></li>
      <li><Link to="/dashboard-12">Dashboard 12</Link></li>








    </ul>

    <ul>
      <li><Link to="/frame-1">Frame 1</Link></li>
      <li><Link to="/frame-2">Frame 2</Link></li>
      <li><Link to="/frame-3">Frame 3</Link></li>
      <li><Link to="/frame-4">Frame 4</Link></li>
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
      <Route path="/dashboard-4" element={<Dashboard4 />} />
      <Route path="/dashboard-5" element={<Dashboard5 />} />
      <Route path="/dashboard-6" element={<Dashboard6 />} />
      <Route path="/dashboard-7" element={<Dashboard7 />} />
      <Route path="/dashboard-8" element={<Dashboard8 />} />
      <Route path="/dashboard-9" element={<Dashboard9 />} />
      <Route path="/dashboard-10" element={<Dashboard10 />} />
      <Route path="/dashboard-11" element={<Dashboard11 />} />
      <Route path="/dashboard-12" element={<Dashboard12 />} />



      {/* Frames */}
      <Route path="/frame-1" element={<Frame1 />} />
      <Route path="/frame-2" element={<Frame2 />} />
      <Route path="/frame-3" element={<Frame3 />} />
    </Routes>
  </Router>
);

export default App;