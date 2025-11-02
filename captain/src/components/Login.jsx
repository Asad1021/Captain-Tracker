// src/components/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { captainsData } from "../data/hardcodedData";
import "./Login.css";

const Login = () => {
  const [salaryCode, setSalaryCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any previous session
    localStorage.clear();
  }, []);

  // const startGeofencing = (workplaceLocation) => {
  //   if (!navigator.geolocation) {
  //     alert('Geolocation is not supported by your browser');
  //     return;
  //   }

  //   const watchId = navigator.geolocation.watchPosition(
  //     (position) => {
  //       const { latitude, longitude } = position.coords;
  //       const currentLocation = { latitude, longitude };

  //       // Store current location
  //       localStorage.setItem('currentLocation', JSON.stringify(currentLocation));

  //       // Calculate distance if workplace is set
  //       if (workplaceLocation) {
  //         const distance = calculateDistance(
  //           latitude,
  //           longitude,
  //           workplaceLocation.latitude,
  //           workplaceLocation.longitude
  //         );

  //         localStorage.setItem('distanceFromWorkplace', distance.toString());
  //       }
  //     },
  //     (error) => {
  //       console.error('Geolocation error:', error);
  //     },
  //     {
  //       enableHighAccuracy: true,
  //       timeout: 5000,
  //       maximumAge: 0,
  //       distanceFilter: 5
  //     }
  //   );

  //   localStorage.setItem('geofenceWatchId', watchId.toString());
  // };

  // In Login.jsx - Update startGeofencing function
// In Login.jsx - Update startGeofencing
const startGeofencing = (workplaceLocation) => {
  if (!navigator.geolocation) {
    return;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const currentLocation = { latitude, longitude };
      
      localStorage.setItem('currentLocation', JSON.stringify(currentLocation));

      if (workplaceLocation) {
        const distance = calculateDistance(
          latitude,
          longitude,
          workplaceLocation.latitude,
          workplaceLocation.longitude
        );
        
        localStorage.setItem('distanceFromWorkplace', distance.toString());
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
    },
    {
      enableHighAccuracy: true, // USE GPS HARDWARE
      timeout: 10000,
      maximumAge: 5000
    }
  );

  localStorage.setItem('geofenceWatchId', watchId.toString());
};


  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleLogin = () => {
    const captain = captainsData[salaryCode];

    if (captain) {
      // Store captain data
      localStorage.setItem("captain", JSON.stringify(captain));

      // Start geofencing immediately after login
      startGeofencing(null);

      setError("");
      navigate("/associate-workplace");
    } else {
      setError("Invalid salary code. Try: 41023122, 41023133, or 41023144");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🎯 Captain Tracker</h1>
          <p>Attendance Management System</p>
        </div>

        <div className="login-form">
          <div className="input-group">
            <label htmlFor="salaryCode">Salary Code</label>
            <input
              id="salaryCode"
              type="text"
              placeholder="Enter your salary code"
              value={salaryCode}
              onChange={(e) => setSalaryCode(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="login-button" onClick={handleLogin}>
            Login
          </button>

          <div className="hint-box">
            <p className="hint-title">🔑 Test Credentials:</p>
            <ul>
              <li>41023122 - Rajesh Kumar</li>
              <li>41023133 - Sunita Desai</li>
              <li>41023144 - Arjun Malhotra</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
