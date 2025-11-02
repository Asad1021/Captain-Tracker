// src/components/Login.jsx - USING STORAGE SERVICE
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {APP_CONFIG} from '../config/appConfig'
import { captainsData } from '../data/hardcodedData';
import './Login.css';

const Login = () => {
  const [salaryCode, setSalaryCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
  // DON'T clear WORKPLACE_* keys - only clear session data
  const keysToRemove = [
    'captain', 'workplace',
    'currentLocation', 'distanceFromWorkplace', 'isInRange',
    'gpsIntervalId', 'gpsError', 'wasInRange'
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // console.log('🔄 Session cleared, WORKPLACE_* keys preserved');
}, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const startContinuousGPSTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    let updateCount = 0;

    const trackingInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateCount++;
          const { latitude, longitude, accuracy } = position.coords;
          const currentLocation = { 
            latitude, 
            longitude, 
            accuracy,
            timestamp: new Date().toISOString(),
            updateNumber: updateCount
          };
          
          // console.log(`🛰️ GPS Update #${updateCount} at ${new Date().toLocaleTimeString()}:`, {
          //   lat: latitude.toFixed(6),
          //   lng: longitude.toFixed(6),
          //   accuracy: Math.round(accuracy) + 'm'
          // });
          
          localStorage.setItem('currentLocation', JSON.stringify(currentLocation));

          const workplaceStr = localStorage.getItem('workplace');
          if (workplaceStr) {
            const workplace = JSON.parse(workplaceStr);
            const distance = calculateDistance(
              latitude,
              longitude,
              workplace.latitude,
              workplace.longitude
            );
            
            const isInRange = distance <= APP_CONFIG.GEOFENCE_RADIUS_METERS;
            
            console.log(`📍 Distance: ${distance.toFixed(2)}m | In Range: ${isInRange}`);
            
            localStorage.setItem('distanceFromWorkplace', distance.toFixed(2));
            localStorage.setItem('isInRange', isInRange ? 'true' : 'false');

            const wasInRange = localStorage.getItem('wasInRange') !== 'false';
            if (wasInRange && !isInRange) {
              console.warn('⚠️ ALERT: Captain went OUT OF RANGE!');
            } else if (!wasInRange && isInRange) {
              console.log('✅ Captain is back IN RANGE');
            }
            localStorage.setItem('wasInRange', isInRange ? 'true' : 'false');
          }
        },
        (error) => {
          console.error('❌ GPS ERROR:', error.message);
          localStorage.setItem('gpsError', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }, 1000);

    localStorage.setItem('gpsIntervalId', trackingInterval.toString());
    console.log('✅ GPS tracking started - Updates every 1 second');
  };
const handleLogin = () => {
  const captain = captainsData[salaryCode];
  
  if (captain) {
    localStorage.setItem('captain', JSON.stringify(captain));
    
    // DIRECT LOAD - NO SERVICE
    const loadKey = `WORKPLACE_${salaryCode}`;
    const savedWorkplace = localStorage.getItem(loadKey);
    
    console.log("🔍 LOOKING FOR:", loadKey);
    console.log("📍 FOUND:", savedWorkplace ? "YES" : "NO");
    
    if (savedWorkplace) {
      localStorage.setItem('workplace', savedWorkplace);
      startContinuousGPSTracking();
      console.log("✅ LOADED WORKPLACE");
      setError('');
      navigate('/dashboard');
    } else {
      startContinuousGPSTracking();
      console.log("📍 NO WORKPLACE - GO ASSOCIATE");
      setError('');
      navigate('/associate-workplace');
    }
  } else {
    setError('Invalid salary code. Try: 41023122, 41023133, or 41023144');
  }
};


  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
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
