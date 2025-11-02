// src/components/QRScanner.jsx - WITH FAST GEOLOCATION
import React, { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import "./QRScanner.css";

const QRScanner = () => {
  const [selectedSubordinate, setSelectedSubordinate] = useState(null);
  const [scanOperation, setScanOperation] = useState("markIn");
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState("");
  const [inTime, setInTime] = useState(null);
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const qrReaderRef = useRef(null);

  useEffect(() => {
    const subordinateData = localStorage.getItem("selectedSubordinate");
    const operation = localStorage.getItem("scanOperation") || "markIn";

    if (!subordinateData) {
      navigate("/dashboard");
      return;
    }

    const subordinate = JSON.parse(subordinateData);
    setSelectedSubordinate(subordinate);
    setScanOperation(operation);

    // If marking out, get the IN time
    if (operation === "markOut") {
      const markedInStr = localStorage.getItem("markedIn");
      if (markedInStr) {
        const markedIn = JSON.parse(markedInStr);
        const employee = markedIn.find((emp) => emp.id === subordinate.id);
        if (employee && employee.markedInAt) {
          setInTime(employee.markedInAt);
        }
      }
    }

    // Add delay to ensure DOM element is ready
    const timer = setTimeout(() => {
      const element = document.getElementById("qr-reader");
      if (!element || scannerRef.current) {
        return;
      }

      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          qrbox: { width: 250, height: 250 },
          fps: 10,
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => onScanSuccess(decodedText, subordinateData, operation),
        (error) => {
          // Suppress console warnings for scanning errors
        }
      );
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => {
          console.error("Failed to clear scanner:", error);
        });
        scannerRef.current = null;
      }
    };
  }, [navigate]);

  const extractSalaryCodeFromURL = (scannedText) => {
    try {
      const url = new URL(scannedText);
      const params = new URLSearchParams(url.search);
      const salaryCode = params.get("ID");
      return salaryCode;
    } catch (error) {
      return scannedText.trim();
    }
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const onScanSuccess = (decodedText, subordinateData, operation) => {
    const subordinate = JSON.parse(subordinateData);
    const scannedSalaryCode = extractSalaryCodeFromURL(decodedText);

    if (scannedSalaryCode === subordinate.salaryCode) {
      setScanning(false);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => {
          console.error("Failed to clear scanner:", error);
        });
      }

      if (operation === "markIn") {
        markIn(subordinate, decodedText);
      } else {
        markOut(subordinate, decodedText);
      }
    } else {
      setError(
        `❌ QR code mismatch!\n\nExpected: ${
          subordinate.salaryCode
        }\nScanned: ${scannedSalaryCode || "Invalid QR code"}`
      );
      setTimeout(() => setError(""), 4000);
    }
  };

  const markIn = (subordinate, qrData) => {
    const markedInStr = localStorage.getItem("markedIn");
    let markedIn = markedInStr ? JSON.parse(markedInStr) : [];

    const alreadyMarked = markedIn.some((emp) => emp.id === subordinate.id);
    if (alreadyMarked) {
      alert(`${subordinate.name} is already marked in!`);
      navigate("/dashboard");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const markInTime = new Date().toISOString();

          const attendanceRecord = {
            ...subordinate,
            markedInAt: markInTime,
            qrData: qrData,
            inLatitude: latitude,
            inLongitude: longitude,
          };

          markedIn.push(attendanceRecord);
          localStorage.setItem("markedIn", JSON.stringify(markedIn));

          const timeStr = new Date(markInTime).toLocaleTimeString();
          alert(
            `✅ ${subordinate.name} marked IN successfully!\n\n⏰ Time: ${timeStr}`
          );
          navigate("/dashboard");
        },
        (error) => {
          // If location fails, still mark attendance without location
          const markInTime = new Date().toISOString();
          const attendanceRecord = {
            ...subordinate,
            markedInAt: markInTime,
            qrData: qrData,
          };

          markedIn.push(attendanceRecord);
          localStorage.setItem("markedIn", JSON.stringify(markedIn));

          const timeStr = new Date(markInTime).toLocaleTimeString();
          alert(
            `✅ ${subordinate.name} marked IN successfully!\n\n⏰ Time: ${timeStr}`
          );
          navigate("/dashboard");
        },
        {
          enableHighAccuracy: true, // USE GPS HARDWARE
          timeout: 15000, // 15 seconds
          maximumAge: 0, // Force fresh GPS reading
        }
      );
    } else {
      const markInTime = new Date().toISOString();
      const attendanceRecord = {
        ...subordinate,
        markedInAt: markInTime,
        qrData: qrData,
      };

      markedIn.push(attendanceRecord);
      localStorage.setItem("markedIn", JSON.stringify(markedIn));

      const timeStr = new Date(markInTime).toLocaleTimeString();
      alert(
        `✅ ${subordinate.name} marked IN successfully!\n\n⏰ Time: ${timeStr}`
      );
      navigate("/dashboard");
    }
  };

  const markOut = (subordinate, qrData) => {
    const markedInStr = localStorage.getItem("markedIn");
    let markedIn = markedInStr ? JSON.parse(markedInStr) : [];

    // Find the employee in markedIn list
    const employeeIndex = markedIn.findIndex(
      (emp) => emp.id === subordinate.id
    );

    if (employeeIndex === -1) {
      alert(`${subordinate.name} is not marked in yet!`);
      navigate("/dashboard");
      return;
    }

    // Remove from markedIn and add to markedOut
    const employee = markedIn[employeeIndex];
    markedIn.splice(employeeIndex, 1);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const markOutTime = new Date().toISOString();

          const markedOutStr = localStorage.getItem("markedOut");
          let markedOut = markedOutStr ? JSON.parse(markedOutStr) : [];

          const attendanceRecord = {
            ...employee,
            markedOutAt: markOutTime,
            qrDataOut: qrData,
            outLatitude: latitude,
            outLongitude: longitude,
          };

          markedOut.push(attendanceRecord);

          localStorage.setItem("markedIn", JSON.stringify(markedIn));
          localStorage.setItem("markedOut", JSON.stringify(markedOut));

          // Create detailed alert message
          const inTimeStr = new Date(employee.markedInAt).toLocaleTimeString();
          const outTimeStr = new Date(markOutTime).toLocaleTimeString();
          const duration = calculateDuration(employee.markedInAt, markOutTime);

          alert(
            `🏁 ${subordinate.name} marked OUT successfully!\n\n` +
              `⏰ IN Time: ${inTimeStr}\n` +
              `🏁 OUT Time: ${outTimeStr}\n` +
              `⏱️ Duration: ${duration}`
          );
          navigate("/dashboard");
        },
        (error) => {
          // If location fails, still mark out without location
          const markOutTime = new Date().toISOString();
          const markedOutStr = localStorage.getItem("markedOut");
          let markedOut = markedOutStr ? JSON.parse(markedOutStr) : [];

          const attendanceRecord = {
            ...employee,
            markedOutAt: markOutTime,
            qrDataOut: qrData,
          };

          markedOut.push(attendanceRecord);

          localStorage.setItem("markedIn", JSON.stringify(markedIn));
          localStorage.setItem("markedOut", JSON.stringify(markedOut));

          const inTimeStr = new Date(employee.markedInAt).toLocaleTimeString();
          const outTimeStr = new Date(markOutTime).toLocaleTimeString();
          const duration = calculateDuration(employee.markedInAt, markOutTime);

          alert(
            `🏁 ${subordinate.name} marked OUT successfully!\n\n` +
              `⏰ IN Time: ${inTimeStr}\n` +
              `🏁 OUT Time: ${outTimeStr}\n` +
              `⏱️ Duration: ${duration}`
          );
          navigate("/dashboard");
        },
        {
          enableHighAccuracy: true, // USE GPS HARDWARE
          timeout: 15000, // 15 seconds
          maximumAge: 0, // Force fresh GPS reading
        }
      );
    } else {
      const markOutTime = new Date().toISOString();
      const markedOutStr = localStorage.getItem("markedOut");
      let markedOut = markedOutStr ? JSON.parse(markedOutStr) : [];

      const attendanceRecord = {
        ...employee,
        markedOutAt: markOutTime,
        qrDataOut: qrData,
      };

      markedOut.push(attendanceRecord);

      localStorage.setItem("markedIn", JSON.stringify(markedIn));
      localStorage.setItem("markedOut", JSON.stringify(markedOut));

      const inTimeStr = new Date(employee.markedInAt).toLocaleTimeString();
      const outTimeStr = new Date(markOutTime).toLocaleTimeString();
      const duration = calculateDuration(employee.markedInAt, markOutTime);

      alert(
        `🏁 ${subordinate.name} marked OUT successfully!\n\n` +
          `⏰ IN Time: ${inTimeStr}\n` +
          `🏁 OUT Time: ${outTimeStr}\n` +
          `⏱️ Duration: ${duration}`
      );
      navigate("/dashboard");
    }
  };

  const handleCancel = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch((error) => {
        console.error("Failed to clear scanner:", error);
      });
    }
    navigate("/dashboard");
  };

  if (!selectedSubordinate) return null;

  return (
    <div className="scanner-container">
      <div className="scanner-card">
        <div
          className={`scanner-header ${
            scanOperation === "markOut" ? "mark-out-header" : ""
          }`}
        >
          <h2>📷 Scan QR Code</h2>
          <p>
            {scanOperation === "markIn"
              ? "Marking IN - Align the ID card QR code within the frame"
              : "Marking OUT - Align the ID card QR code within the frame"}
          </p>
        </div>

        <div className="selected-info">
          <p className="info-title">
            {scanOperation === "markIn"
              ? "Marking IN for:"
              : "Marking OUT for:"}
          </p>
          <div
            className={`selected-subordinate ${
              scanOperation === "markOut" ? "mark-out-border" : ""
            }`}
          >
            <div className="selected-name">{selectedSubordinate.name}</div>
            <div className="selected-code">
              {selectedSubordinate.salaryCode}
            </div>
            {scanOperation === "markOut" && inTime && (
              <div className="in-time-display">
                ⏰ Marked IN at: {new Date(inTime).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="scan-error">
            {error.split("\n").map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        )}

        <div id="qr-reader" ref={qrReaderRef} className="qr-reader"></div>

        <div className="scanner-actions">
          <button className="cancel-button" onClick={handleCancel}>
            ← Back to Dashboard
          </button>
        </div>

        <div className="scanner-instructions">
          <h4>📝 Instructions:</h4>
          <ul>
            <li>Point camera at the employee's ID card QR code</li>
            <li>Ensure good lighting and steady hand for best results</li>
            <li>
              Expected salary code:{" "}
              <strong>{selectedSubordinate.salaryCode}</strong>
            </li>
            {scanOperation === "markOut" && inTime && (
              <li>
                Employee was marked IN at:{" "}
                <strong>{new Date(inTime).toLocaleTimeString()}</strong>
              </li>
            )}
            <li>The QR code will be automatically scanned once detected</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
