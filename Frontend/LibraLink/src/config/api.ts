// TEMPORARY (local testing): points the app at the locally-running backend on :8080
// (the backend's default PORT). localhost works from the iOS Simulator (it shares the
// Mac's network) and, unlike a LAN IP, survives Wi-Fi changes. For a physical device,
// swap in the Mac's LAN IP. Revert to "https://libralink-rgp2.onrender.com" before deploy.
const API_BASE_URL = "http://localhost:8080";

export { API_BASE_URL };
