// src/components/AssociateWorkplace.jsx - FIXED VERSION
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AssociateWorkplace.css";

const AssociateWorkplace = () => {
  const [workplaceName, setWorkplaceName] = useState("");
  const [captain, setCaptain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const captainData = localStorage.getItem("captain");
    if (!captainData) {
      navigate("/");
      return;
    }
    const parsedCaptain = JSON.parse(captainData);
    setCaptain(parsedCaptain);
    
    console.log("✅ Captain loaded:", parsedCaptain);
    console.log("📝 Salary Code:", parsedCaptain.salaryCode);
  }, [navigate]);

  const getGPSLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      let bestPosition = null;
      let attempts = 0;
      const maxAttempts = 3;

      setLocationStatus("📡 Acquiring GPS signal...");

      const tryGetLocation = () => {
        attempts++;

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const accuracy = position.coords.accuracy;

            if (accuracy < 20 || attempts >= maxAttempts) {
              setLocationStatus(
                `✅ GPS acquired! Accuracy: ${Math.round(accuracy)}m`
              );
              resolve(position);
            } else {
              bestPosition = position;
              setLocationStatus(
                `📡 Refining GPS... (${Math.round(
                  accuracy
                )}m accuracy, attempt ${attempts}/${maxAttempts})`
              );

              if (attempts < maxAttempts) {
                setTimeout(tryGetLocation, 1000);
              } else {
                resolve(bestPosition);
              }
            }
          },
          (error) => {
            if (bestPosition) {
              resolve(bestPosition);
            } else if (attempts < maxAttempts) {
              setLocationStatus(
                `⚠️ GPS attempt ${attempts} failed, retrying...`
              );
              setTimeout(tryGetLocation, 1000);
            } else {
              reject(error);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      };

      tryGetLocation();
    });
  };

const handleSubmit = async () => {
  if (!workplaceName.trim()) {
    alert("Please enter workplace name");
    return;
  }

  setLoading(true);
  setLocationError("");
  setLocationStatus("🛰️ Initializing GPS...");

  try {
    const position = await getGPSLocation();
    const { latitude, longitude, accuracy } = position.coords;

    if (accuracy > 50) {
      const confirmProceed = window.confirm(
        `⚠️ GPS Accuracy Warning\n\nCurrent accuracy: ${Math.round(accuracy)} meters\n\nProceed?`
      );
      if (!confirmProceed) {
        setLoading(false);
        setLocationStatus("");
        return;
      }
    }

    const workplace = {
      name: workplaceName,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
      accuracy: accuracy,
    };

    // DIRECT SAVE - NO SERVICE
    const saveKey = `WORKPLACE_${captain.salaryCode}`;
    localStorage.setItem(saveKey, JSON.stringify(workplace));
    localStorage.setItem("workplace", JSON.stringify(workplace));
    
    console.log("✅ SAVED TO:", saveKey);
    console.log("✅ DATA:", workplace);

    updateGeofencing(workplace);
    setLoading(false);

    alert(`✅ Workplace "${workplaceName}" saved!`);
    navigate("/dashboard");
  } catch (error) {
    setLoading(false);
    handleLocationError(error);
  }
};


  const handleLocationError = (error) => {
    let errorMessage = "";

    switch (error.code) {
      case 1:
        errorMessage =
          "Location permission denied. Please enable location access in your browser settings.";
        break;
      case 2:
        errorMessage =
          "GPS signal unavailable. Please:\n• Move to an open area\n• Ensure GPS is enabled\n• Check if you're indoors (GPS works poorly indoors)";
        break;
      case 3:
        errorMessage =
          "GPS timeout. Please:\n• Move closer to a window\n• Ensure clear sky view\n• Try again in a moment";
        break;
      default:
        errorMessage =
          "Unable to get GPS location. Please check your device settings.";
    }

    alert(errorMessage);
    setLocationError(
      "GPS location failed. Please ensure GPS is enabled and you have a clear sky view."
    );
    setLocationStatus("");
  };

  const updateGeofencing = (workplace) => {
    const intervalIdStr = localStorage.getItem("gpsIntervalId");
    if (intervalIdStr) {
      clearInterval(parseInt(intervalIdStr));
    }

    // let updateCount = 0;

    const trackingInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // updateCount++;
          const { latitude, longitude, accuracy } = position.coords;
          const distance = calculateDistance(
            latitude,
            longitude,
            workplace.latitude,
            workplace.longitude
          );

          // console.log(
          //   `🛰️ Update #${updateCount}: ${distance.toFixed(2)}m from workplace`
          // );

          localStorage.setItem("distanceFromWorkplace", distance.toString());
          localStorage.setItem(
            "currentLocation",
            JSON.stringify({
              latitude,
              longitude,
              accuracy,
            })
          );
          localStorage.setItem("isInRange", distance <= 20 ? "true" : "false");
        },
        (error) => console.error("GPS error:", error),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }, 1000);

    localStorage.setItem("gpsIntervalId", trackingInterval.toString());
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

  // DEBUG FUNCTION - Remove after testing
  const handleDebug = () => {
    console.log("=== 🔍 DEBUG INFO ===");
    console.log("Captain state:", captain);
    console.log("Captain salaryCode:", captain?.salaryCode);
    console.log("All localStorage keys:", Object.keys(localStorage));
    console.log(
      "Workplace keys:",
      Object.keys(localStorage).filter((k) => k.startsWith("workplace_"))
    );
    if (captain?.salaryCode) {
      const key = `workplace_${captain.salaryCode}`;
      console.log(`Checking key: ${key}`);
      console.log("Value:", localStorage.getItem(key));
    }
    alert("Check console for debug info");
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
            <div className="status-message">{locationStatus}</div>
          )}

          {locationError && (
            <div className="error-message">{locationError}</div>
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
              "🛰️ Get GPS Location & Continue"
            )}
          </button>

          {/* DEBUG BUTTON - Remove after testing */}
          <button
            className="submit-button"
            onClick={handleDebug}
            style={{ background: "#333", marginTop: "10px" }}
          >
            🔍 Debug Storage
          </button>

          <div className="info-box">
            <p>
              🛰️ <strong>GPS Hardware will be used for precise location</strong>
            </p>
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
