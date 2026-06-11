export const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" && window.location.port === "3000" ? "http://127.0.0.1:8000" : "");

