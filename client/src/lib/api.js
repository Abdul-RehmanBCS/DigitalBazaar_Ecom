import axios from "axios";

const apiRoot = (import.meta.env.VITE_API_ROOT || "http://localhost:5000").replace(/\/$/, "");

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `${apiRoot}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
