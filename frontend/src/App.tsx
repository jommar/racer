import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RaceSimulator from './pages/RaceSimulator';

function App() {
  return (
    <Router>
      <div className="bg-background text-white selection:bg-primary/30">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/simulator" element={<RaceSimulator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
