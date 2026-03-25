import axios from "axios";

let authTokenGetter = null;
let authUserIdGetter = null;

export const setAuthTokenGetter = (getter) => {
  authTokenGetter = getter;
};

export const setAuthUserIdGetter = (getter) => {
  authUserIdGetter = getter;
};

const api = axios.create({
  baseURL: "/api", // Proxy will handle localhost:5001
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  if (authTokenGetter) {
    const token = await authTokenGetter();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (authUserIdGetter) {
    const userId = await authUserIdGetter();
    if (userId) {
      config.headers["x-user-id"] = userId;
    }
  }

  return config;
});

export const fileService = {
  getFileSystem: () => api.get("/files"),
  createFileNode: (name, type, parentId, link) =>
    api.post("/files", { name, type, parentId, link }),
  deleteFileNode: (id) => api.delete(`/files/${id}`),
  updateFileNode: (id, data) => api.put(`/files/${id}`, data),
  getProblem: (fileId) => api.get(`/problems/${fileId}`),
  createProblem: (fileId) => api.post("/problems", { fileId }),
  updateProblem: (fileId, data) => api.put(`/problems/${fileId}`, data),
  analyzeCode: (code, language) => api.post("/ai/analyze", { code, language }),
  importProblem: (url) => api.post("/problems/import", { url }),
};

export default api;
