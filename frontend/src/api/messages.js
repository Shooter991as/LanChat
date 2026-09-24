import axios from "axios";
import { API_BASE } from "../config";

export async function fetchPublicHistory(token) {
  const res = await axios.get(`${API_BASE}/messages/public`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchDMHistory(token, username) {
  const res = await axios.get(`${API_BASE}/messages/dm/${username}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
