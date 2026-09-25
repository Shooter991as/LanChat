import axios from "axios";
import { API_BASE } from "../config";

export async function uploadFile(token, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(`${API_BASE}/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data; // { url, originalName }
}
