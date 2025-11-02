// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AssociateWorkplace from './components/AssociateWorkplace';
import Dashboard from './components/Dashboard';
import QRScanner from './components/QRScanner';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/associate-workplace" element={<AssociateWorkplace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/qr-scanner" element={<QRScanner />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
