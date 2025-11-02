import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const [captain, setCaptain] = useState(null);
  const [workplace, setWorkplace] = useState(null);
  const [subordinates, setSubordinates] = useState([]);
  const [markedIn, setMarkedIn] = useState([]);
  const [markedOut, setMarkedOut] = useState([]);
  const [isInRange, setIsInRange] = useState(true);
  const [distance, setDistance] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const captainData = localStorage.getItem("captain");

    const workplaceData = localStorage.getItem("workplace");

    if (!captainData || !workplaceData) {
      navigate("/");
      return;
    }

    const captain = JSON.parse(captainData);
    const workplace = JSON.parse(workplaceData);

    setCaptain(captain);
    setWorkplace(workplace);
    setSubordinates(captain.subordinates);

    const savedMarkedIn = localStorage.getItem("markedIn");
    if (savedMarkedIn) {
      setMarkedIn(JSON.parse(savedMarkedIn));
    }

    const savedMarkedOut = localStorage.getItem("markedOut");
    if (savedMarkedOut) {
      setMarkedOut(JSON.parse(savedMarkedOut));
    }

    const monitorInterval = setInterval(() => {
      const distanceStr = localStorage.getItem("distanceFromWorkplace");
      const inRangeStr = localStorage.getItem("isInRange");
      const locationStr = localStorage.getItem("currentLocation");

      if (distanceStr) {
        const dist = parseFloat(distanceStr);
        setDistance(dist);
        setIsInRange(inRangeStr === "true");
      }

      if (locationStr) {
        const location = JSON.parse(locationStr);
        setGpsAccuracy(location.accuracy || 0);
      }
    }, 1000);

    return () => {
      clearInterval(monitorInterval);
    };
  }, [navigate]);

  const handleMarkIn = (subordinate) => {
    if (!isInRange) {
      alert(
        "⚠️ OUT OF RANGE!\n\nYou must be within 20 meters of your workplace to mark attendance."
      );
      return;
    }
    localStorage.setItem("selectedSubordinate", JSON.stringify(subordinate));
    localStorage.setItem("scanOperation", "markIn");
    navigate("/qr-scanner");
  };

  const handleMarkOut = (subordinate) => {
    if (!isInRange) {
      alert(
        "⚠️ OUT OF RANGE!\n\nYou must be within 20 meters of your workplace to mark attendance."
      );
      return;
    }
    localStorage.setItem("selectedSubordinate", JSON.stringify(subordinate));
    localStorage.setItem("scanOperation", "markOut");
    navigate("/qr-scanner");
  };
  const handleDeassociateWorkplace = () => {
    const confirmed = window.confirm(
      `⚠️ Deassociate Workplace?\n\nCurrent: ${workplace.name}\n\nContinue?`
    );

    if (confirmed) {
      // DIRECT DELETE
      const deleteKey = `WORKPLACE_${captain.salaryCode}`;
      localStorage.removeItem(deleteKey);
      localStorage.removeItem("workplace");
      localStorage.removeItem("markedIn");
      localStorage.removeItem("markedOut");

      console.log("🗑️ DELETED:", deleteKey);

      alert("✅ Workplace removed!");
      navigate("/associate-workplace");
    }
  };

const handleLogout = () => {
  const intervalIdStr = localStorage.getItem('gpsIntervalId');
  if (intervalIdStr) {
    navigator.geolocation.clearWatch(parseInt(intervalIdStr));
  }
  
  // Only clear session data, NOT saved workplaces
  const keysToRemove = [
  'captain', 'workplace',
    'currentLocation', 'distanceFromWorkplace', 'isInRange',
    'gpsError', 'wasInRange', 'gpsIntervalId'
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  console.log('🚪 Logged out - WORKPLACE_* keys preserved');
  navigate('/');
};


  const pendingSubordinates = subordinates.filter(
    (sub) =>
      !markedIn.some((marked) => marked.id === sub.id) &&
      !markedOut.some((marked) => marked.id === sub.id)
  );

  if (!captain || !workplace) return null;

  return (
    <div className="dashboard-container">
      {!isInRange && (
        <div className="warning-banner-locked">
          <span className="warning-icon">🔒</span>
          <div>
            <strong>APP LOCKED - OUT OF RANGE!</strong>
            <p>
              Distance: {distance.toFixed(1)}m from workplace - Return within
              20m to unlock
            </p>
          </div>
        </div>
      )}

      <div className={`dashboard-content ${!isInRange ? "locked" : ""}`}>
        <div className="dashboard-header">
          <div className="header-top">
            <h2>📊 Captain Dashboard</h2>
            <div className="header-buttons">
              <button
                className="deassociate-button"
                onClick={handleDeassociateWorkplace}
              >
                🗑️ Deassociate
              </button>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          <div className="captain-details">
            <div className="detail-item">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{captain.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Cadre:</span>
              <span className="detail-value">{captain.cadre}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Workplace:</span>
              <span className="detail-value">{workplace.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">GPS Status:</span>
              <span
                className={`status-badge ${
                  isInRange ? "in-range" : "out-range"
                }`}
              >
                {isInRange
                  ? `✓ In Range (${distance.toFixed(0)}m)`
                  : `✗ Out of Range (${distance.toFixed(0)}m)`}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">GPS Accuracy:</span>
              <span className="detail-value">{Math.round(gpsAccuracy)}m</span>
            </div>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card pending">
            <div className="stat-number">{pendingSubordinates.length}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card marked">
            <div className="stat-number">{markedIn.length}</div>
            <div className="stat-label">Marked In</div>
          </div>
          <div className="stat-card marked-out">
            <div className="stat-number">{markedOut.length}</div>
            <div className="stat-label">Marked Out</div>
          </div>
          <div className="stat-card total">
            <div className="stat-number">{subordinates.length}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>

        <div className="lists-container">
          <div className="list-section">
            <h3 className="list-title pending-title">
              ⏳ Pending ({pendingSubordinates.length})
            </h3>
            <div className="subordinate-list">
              {pendingSubordinates.length === 0 ? (
                <div className="empty-state">
                  <p>🎉 All attendance marked!</p>
                </div>
              ) : (
                pendingSubordinates.map((sub) => (
                  <div key={sub.id} className="subordinate-card">
                    <div className="subordinate-info">
                      <div className="subordinate-name">{sub.name}</div>
                      <div className="subordinate-details">
                        {sub.salaryCode} • {sub.cadre}
                      </div>
                    </div>
                    <button
                      className="mark-button"
                      onClick={() => handleMarkIn(sub)}
                      disabled={!isInRange}
                    >
                      📷 Mark In
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="list-section">
            <h3 className="list-title marked-title">
              ✅ Marked In ({markedIn.length})
            </h3>
            <div className="subordinate-list">
              {markedIn.length === 0 ? (
                <div className="empty-state">
                  <p>No one marked in yet</p>
                </div>
              ) : (
                markedIn.map((sub) => (
                  <div key={sub.id} className="subordinate-card marked-card">
                    <div className="subordinate-info">
                      <div className="subordinate-name">{sub.name}</div>
                      <div className="subordinate-details">
                        {sub.salaryCode} • {sub.cadre}
                      </div>
                      {sub.markedInAt && (
                        <div className="marked-time">
                          ⏰ In: {new Date(sub.markedInAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    <button
                      className="mark-out-button"
                      onClick={() => handleMarkOut(sub)}
                      disabled={!isInRange}
                    >
                      📷 Mark Out
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="list-section">
            <h3 className="list-title marked-out-title">
              🏁 Marked Out ({markedOut.length})
            </h3>
            <div className="subordinate-list">
              {markedOut.length === 0 ? (
                <div className="empty-state">
                  <p>No one marked out yet</p>
                </div>
              ) : (
                markedOut.map((sub) => {
                  const calculateDuration = (startTime, endTime) => {
                    const start = new Date(startTime);
                    const end = new Date(endTime);
                    const diffMs = end - start;

                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor(
                      (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                    );

                    if (hours > 0) {
                      return `${hours}h ${minutes}m`;
                    }
                    return `${minutes}m`;
                  };

                  const duration =
                    sub.markedInAt && sub.markedOutAt
                      ? calculateDuration(sub.markedInAt, sub.markedOutAt)
                      : null;

                  return (
                    <div
                      key={sub.id}
                      className="subordinate-card marked-out-card"
                    >
                      <div className="subordinate-info">
                        <div className="subordinate-name">{sub.name}</div>
                        <div className="subordinate-details">
                          {sub.salaryCode} • {sub.cadre}
                        </div>
                        <div className="time-details">
                          {sub.markedInAt && (
                            <div className="marked-time">
                              ⏰ In:{" "}
                              {new Date(sub.markedInAt).toLocaleTimeString()}
                            </div>
                          )}
                          {sub.markedOutAt && (
                            <div className="marked-time">
                              🏁 Out:{" "}
                              {new Date(sub.markedOutAt).toLocaleTimeString()}
                            </div>
                          )}
                          {duration && (
                            <span className="duration-badge">
                              ⏱️ Duration: {duration}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="double-checkmark">✓✓</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
