// TEMPORARY (local testing): points the app at the locally-running backend on :8080
// (the backend's default PORT). This uses the Mac's LAN IP so BOTH the iOS Simulator
// and a physical Android/iOS device (on the same Wi-Fi) can reach the backend at once.
// The LAN IP changes when the Mac reconnects to Wi-Fi — recheck with
// `ipconfig getifaddr en0` and update here if a physical device can't connect.
// Revert to "https://libralink-rgp2.onrender.com" before deploy.
const API_BASE_URL = "http://192.168.199.144:8080";

export { API_BASE_URL };
