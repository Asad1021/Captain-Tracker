// src/config/appConfig.js
export const APP_CONFIG = {
  GEOFENCE_RADIUS_METERS: 20,  // Change this value only!
  GPS_UPDATE_INTERVAL: 1000,    // How often to check GPS (milliseconds)
  GPS_TIMEOUT: 15000,           // GPS timeout (milliseconds)
  GPS_DISTANCE_FILTER: 5        // Update when moved X meters
};
