// Defaults to the deployed production backend. Override for local development
// via EXPO_PUBLIC_API_BASE_URL in .env.local (see .env.example) - Expo inlines
// EXPO_PUBLIC_* vars at build time, same convention as Web's VITE_API_BASE_URL.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://libralink-rgp2.onrender.com";

export { API_BASE_URL };
