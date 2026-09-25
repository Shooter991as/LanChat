// Auto-detects the backend address from whatever host the browser used to load
// this page. Since every device already reaches the frontend via the server
// machine's LAN IP (e.g. http://192.168.1.5:5173/chat), we reuse that same
// hostname for the backend on port 5000 — no more manually editing .env
// every time the server machine's IP changes on reboot.
//
// VITE_SERVER_URL in .env still works as a manual override if you ever need
// frontend and backend on two different machines — leave it unset/commented
// for the normal case.

const BACKEND_PORT = 5000;

function inferServerURL() {
  if (typeof window !== "undefined" && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}`;
  }
  return "http://localhost:5000";
}

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || inferServerURL();
export const API_BASE = `${SERVER_URL}/api`;
