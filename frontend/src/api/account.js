import axios from "axios";
import { API_BASE } from "../config";

export async function changePassword(token, { currentPassword, newPassword }) {
  const res = await axios.put(
    `${API_BASE}/account/password`,
    { currentPassword, newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function deleteAccount(token, password) {
  const res = await axios.delete(`${API_BASE}/account`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { password }, // axios requires DELETE bodies under `data`
  });
  return res.data;
}
