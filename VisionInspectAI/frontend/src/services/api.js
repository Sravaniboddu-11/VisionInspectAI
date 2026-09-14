import axios from "axios";

const api = axios.create({
  baseURL: "https://visioninspectai-jvbu.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;