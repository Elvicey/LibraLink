// TEMPORARY (local testing): points the app at the locally-running backend on :8080
// (the backend's default PORT). iOS Simulator shares the Mac's network, so localhost
// works directly. Revert to "https://libralink-rgp2.onrender.com" before deploy, or to
// a LAN IP (`ipconfig getifaddr en0`) if testing on a physical device instead.
const API_BASE_URL = "http://localhost:8080";

export { API_BASE_URL };
