import axios from "axios";
import { API_BASE } from "../config";

export async function registerUser({ username, password }) {
  const res = await axios.post(`${API_BASE}/auth/register`, { username, password });
  return res.data;
}

export async function loginUser({ username, password }) {
  const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
  return res.data;
}
