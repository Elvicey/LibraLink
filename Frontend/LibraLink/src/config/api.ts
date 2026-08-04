// Points at the deployed production backend. For local testing against a backend
// running on your own machine instead, temporarily swap this to "http://localhost:8080"
// (iOS Simulator shares the Mac's network, so localhost works directly), or to a LAN IP
// (`ipconfig getifaddr en0`) if testing on a physical device - just remember to revert
// before shipping.
const API_BASE_URL = "https://libralink-backend.onrender.com";

export { API_BASE_URL };
