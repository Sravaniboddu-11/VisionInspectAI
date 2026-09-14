import axios from "axios";

const api = axios.create({
  baseURL: "https://visioninspectai-backend-lnih.onrender.com",
});

export default api;