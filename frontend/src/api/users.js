import axios from "axios";
import { API_BASE } from "../config";

export async function fetchAllUsers(token) {
  const res = await axios.get(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
