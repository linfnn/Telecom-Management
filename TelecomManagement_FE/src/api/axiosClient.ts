import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.DEV ? "" : import.meta.env.VITE_DEFAULT_API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_DEFAULT_API_TIMEOUT_MS || "10000"),
  headers: {
    Accept: "application/json",
  },
});

export default axiosClient;
