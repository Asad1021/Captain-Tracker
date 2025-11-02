// src/components/AssociateWorkplace.jsx - GPS PRECISION WITH SMART UX
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AssociateWorkplace.css';

const AssociateWorkplace = () => {
  const [workplaceName, setWorkplaceName] = useState('');
  const [captain, setCaptain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const captainData = localStorage.getItem('captain');
    if (!captainData) {
      navigate('/');
      return;
    }
    setCaptain(JSON.parse(captainData));
  }, [navigate]);

  const getGPSLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      let bestPosition = null;
      let attempts = 0;
      const maxAttempts = 3;

      setLocationStatus('📡 Acquiring GPS signal...');

      const tryGetLocation = () => {
        attempts++;
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const accuracy = position.coords.accuracy;
            
            // If we have good accuracy (< 20m) or reached max attempts, use it
            if (accuracy < 20 || attempts >= maxAttempts) {
              setLocationStatus(`✅ GPS acquired! Accuracy: ${Math.round(accuracy)}m`);
              resolve(position);
            } else {
              // Try to get better accuracy
              bestPosition = position;
              setLocationStatus(`📡 Refining GPS... (${Math.round(accuracy)}m accuracy, attempt ${attempts}/${maxAttempts})`);
              
              if (attempts < maxAttempts) {
                setTimeout(tryGetLocation, 1000); // Try again after 1 second
              } else {
                resolve(bestPosition);
              }
            }
          },
          (error) => {
            if (bestPosition) {
              // Use best position we have
              resolve(bestPosition);
            } else if (attempts < maxAttempts) {
              setLocationStatus(`⚠️ GPS attempt ${attempts} failed, retrying...`);
              setTimeout(tryGetLocation, 1000);
            } else {
              reject(error);
            }
          },
          {
            enableHighAccuracy: true, // USE GPS HARDWARE
            timeout: 15000, // 15 seconds per attempt
            maximumAge: 0 // Force fresh GPS reading
          }
        );
      };

      tryGetLocation();
    });
  };

  const handleSubmit = async () => {
    if (!workplaceName.trim()) {
      alert('Please enter workplace name');
      return;
    }

    setLoading(true);
    setLocationError('');
    setLocationStatus('🛰️ Initializing GPS...');

    try {
      const position = await getGPSLocation();
      const { latitude, longitude, accuracy } = position.coords;
      
      if (accuracy > 50) {
        const confirmProceed = window.confirm(
          `⚠️ GPS Accuracy Warning\n\n` +
          `Current accuracy: ${Math.round(accuracy)} meters\n\n` +
          `For best results, we recommend:\n` +
          `• Move closer to a window\n` +
          `• Ensure clear view of sky\n` +
          `• Wait a few moments\n\n` +
          `Proceed with current accuracy?`
        );
        
        if (!confirmProceed) {
          setLoading(false);
          setLocationStatus('');
          return;
        }
      }

      const workplace = {
        name: workplaceName,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        accuracy: accuracy
      };

      localStorage.setItem('workplace', JSON.stringify(workplace));
      
      // Update geofencing with workplace location
      updateGeofencing(workplace);
      
      setLoading(false);
      
      alert(
        `✅ Workplace location saved!\n\n` +
        `🛰️ GPS Coordinates:\n` +
        `Latitude: ${latitude.toFixed(6)}\n` +
        `Longitude: ${longitude.toFixed(6)}\n\n` +
        `📍 Accuracy: ${Math.round(accuracy)} meters`
      );
      
      navigate('/dashboard');
    } catch (error) {
      setLoading(false);
      handleLocationError(error);
    }
  };

  const handleLocationError = (error) => {
    let errorMessage = '';
    
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
        break;
      case 2: // POSITION_UNAVAILABLE
        errorMessage = 'GPS signal unavailable. Please:\n• Move to an open area\n• Ensure GPS is enabled\n• Check if you\'re indoors (GPS works poorly indoors)';
        break;
      case 3: // TIMEOUT
        errorMessage = 'GPS timeout. Please:\n• Move closer to a window\n• Ensure clear sky view\n• Try again in a moment';
        break;
      default:
        errorMessage = 'Unable to get GPS location. Please check your device settings.';
    }
    
    alert(errorMessage);
    setLocationError('GPS location failed. Please ensure GPS is enabled and you have a clear sky view.');
    setLocationStatus('');
  };

  const updateGeofencing = (workplace) => {
    const watchIdStr = localStorage.getItem('geofenceWatchId');
    if (watchIdStr) {
      const watchId = parseInt(watchIdStr);
      navigator.geolocation.clearWatch(watchId);
    }

    // Continuous GPS tracking for precise geofencing
    const newWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(
          latitude,
          longitude,
          workplace.latitude,
          workplace.longitude
        );
        
        localStorage.setItem('distanceFromWorkplace', distance.toString());
        localStorage.setItem('currentLocation', JSON.stringify({ 
          latitude, 
          longitude,
          accuracy: position.coords.accuracy 
        }));
      },
      (error) => console.error('Geofencing error:', error),
      {
        enableHighAccuracy: true, // Continuous GPS tracking
        timeout: 10000,
        maximumAge: 5000
      }
    );

    localStorage.setItem('geofenceWatchId', newWatchId.toString());
  };

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

  if (!captain) return null;

  return (
    <div className="workplace-container">
      <div className="workplace-card">
        <div className="workplace-header">
          <h2>📍 Associate Workplace</h2>
          <p>Set your work location for today</p>
        </div>

        <div className="captain-info-card">
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span className="info-value">{captain.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Cadre:</span>
            <span className="info-value">{captain.cadre}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Salary Code:</span>
            <span className="info-value">{captain.salaryCode}</span>
          </div>
        </div>

        <div className="workplace-form">
          <div className="input-group">
            <label htmlFor="workplaceName">Workplace Name</label>
            <input
              id="workplaceName"
              type="text"
              placeholder="e.g., Main Office, Site A, Warehouse 2"
              value={workplaceName}
              onChange={(e) => setWorkplaceName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          {locationStatus && (
            <div className="status-message">
              {locationStatus}
            </div>
          )}

          {locationError && (
            <div className="error-message">
              {locationError}
            </div>
          )}

          <button 
            className="submit-button" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Getting GPS Location...
              </>
            ) : (
              '🛰️ Get GPS Location & Continue'
            )}
          </button>

          <div className="info-box">
            <p>🛰️ <strong>GPS Hardware will be used for precise location</strong></p>
            <p>📍 Target accuracy: Less than 20 meters</p>
            <p>⚠️ For best GPS signal:</p>
            <ul>
              <li>Move to an open area or near a window</li>
              <li>Ensure clear view of the sky</li>
              <li>GPS may take 10-30 seconds for first fix</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssociateWorkplace;
