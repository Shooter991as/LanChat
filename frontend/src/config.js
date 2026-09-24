// One place to change the server address. Every API/socket file imports from here.
// Set VITE_SERVER_URL in frontend/.env to your backend machine's LAN IP — "localhost"
// only works when the frontend and backend run on the exact same device.
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
export const API_BASE = `${SERVER_URL}/api`;
