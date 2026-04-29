import axios from "axios";

export const API_BASE = "https://lbnovo.onrender.com";

// Render free tier puts the server to sleep after ~15 min of inactivity.
// First request after a cold start can take 30–60s, so we use a generous
// timeout. Subsequent requests are fast.
const REQUEST_TIMEOUT_MS = 60000;

const api = axios.create({
  baseURL: API_BASE,
  timeout: REQUEST_TIMEOUT_MS,
});

// ---------- Connection status (observable) ----------
// status: "unknown" | "connecting" | "online" | "offline"
const listeners = new Set();
let connectionStatus = "unknown";

export const getConnectionStatus = () => connectionStatus;

export function subscribeConnection(fn) {
  listeners.add(fn);
  fn(connectionStatus);
  return () => listeners.delete(fn);
}

function setStatus(s) {
  if (connectionStatus === s) return;
  connectionStatus = s;
  listeners.forEach((fn) => {
    try { fn(s); } catch { /* ignore */ }
  });
}

// ---------- Auth header ----------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Mark online on any successful response, offline on any network error.
api.interceptors.response.use(
  (res) => { setStatus("online"); return res; },
  (err) => {
    // 4xx/5xx with a response means the server IS online (just rejected us)
    if (err && err.response) setStatus("online");
    else setStatus("offline");
    return Promise.reject(err);
  },
);

// ---------- Wake-up ping ----------
// Call once on app boot to wake the Render dyno before the user logs in.
let wakeupPromise = null;
export function wakeUp() {
  if (wakeupPromise) return wakeupPromise;
  setStatus("connecting");
  wakeupPromise = axios
    .get(`${API_BASE}/`, { timeout: REQUEST_TIMEOUT_MS })
    .then(() => { setStatus("online"); return true; })
    .catch(() => { setStatus("offline"); return false; })
    .finally(() => {
      // Allow a fresh wake-up attempt later if needed.
      setTimeout(() => { wakeupPromise = null; }, 5000);
    });
  return wakeupPromise;
}

// ---------- AUTH ----------
// No fake/local token fallback. If the API is down, login fails loudly.
export const authService = {
  async login(usuario, senha) {
    const res = await api.post("/login", { usuario, senha });
    const token = res?.data?.token || res?.data?.access_token;
    if (!token) throw new Error("Resposta de login inválida do servidor");
    return { token, source: "api" };
  },
};

// ---------- CRUD factory ----------
// Every operation hits the backend. No localStorage fallback for data.
function makeCrud(resource) {
  return {
    async list() {
      const res = await api.get(`/${resource}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    async get(id) {
      const res = await api.get(`/${resource}/${id}`);
      return res.data;
    },
    async create(data) {
      const res = await api.post(`/${resource}`, data);
      return res.data || data;
    },
    async update(id, data) {
      const res = await api.put(`/${resource}/${id}`, data);
      return res.data || { id, ...data };
    },
    async remove(id) {
      await api.delete(`/${resource}/${id}`);
      return { id };
    },
  };
}

export const clientesService = makeCrud("clientes");
export const veiculosService = makeCrud("veiculos");
export const osService = makeCrud("os");
export const servicosService = makeCrud("servicos");
export const pecasService = makeCrud("pecas");
export const orcamentosService = makeCrud("orcamentos");
export const financeiroService = makeCrud("financeiro");
export const garantiasService = makeCrud("garantias");

// ---------- UPLOAD ----------
export const uploadService = {
  async upload(file, tipo = "manutencao") {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tipo", tipo);
    const res = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default api;
