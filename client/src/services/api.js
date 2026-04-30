import axios from "axios";

let authTokenGetter = null;
let authUserIdGetter = null;

const isBrowser = typeof window !== "undefined";
const devApiBaseUrl =
  isBrowser && import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:5001/api`
    : "/api";

export const setAuthTokenGetter = (getter) => {
  authTokenGetter = getter;
};

export const setAuthUserIdGetter = (getter) => {
  authUserIdGetter = getter;
};

const api = axios.create({
  baseURL: devApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

const RETRY_DELAYS_MS = [500, 1200, 2500, 4000, 6000, 8000];

const shouldRetryRequest = (error) => {
  const status = error?.response?.status;
  const code = error?.code;

  return status === 502 || code === "ERR_NETWORK" || code === "ECONNABORTED";
};

const wait = (delay) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });

const withRetry = async (requestFn) => {
  let lastError = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (
        attempt === RETRY_DELAYS_MS.length ||
        !shouldRetryRequest(error)
      ) {
        break;
      }

      await wait(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
};

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

export const statsService = {
  getLoginStats: () => withRetry(() => api.get("/stats/logins")),
  recordLogin: (sessionId) =>
    withRetry(() => api.post("/stats/logins", { sessionId })),
};

export default api;
