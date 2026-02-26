import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

API.interceptors.request.use((config) => {
  const raw = localStorage.getItem("user");
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.access_token) {
      config.headers.Authorization = `Bearer ${parsed.access_token}`;
    }
  }
  return config;
});

export default API;
