import axios from "axios";
import { localDB } from "./localDB";

export const API_BASE = "https://lb-mecanica.onrender.com";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Generic safe-call: tries the API; on failure falls back to localStorage CRUD
async function safe(promise, fallback) {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    if (typeof fallback === "function") return fallback();
    throw err;
  }
}

// ---------- AUTH ----------
export const authService = {
  async login(usuario, senha) {
    try {
      const res = await api.post("/login", { usuario, senha });
      const token = res?.data?.token || res?.data?.access_token;
      if (token) {
        return { token, source: "api" };
      }
    } catch (_) { /* ignore, fallback below */ }

    // Fallback: hardcoded local credentials
    if (usuario === "lbmecanica" && senha === "eaixuxu") {
      const fakeToken = `lb_${btoa(usuario + ":" + Date.now())}`;
      return { token: fakeToken, source: "local" };
    }
    throw new Error("Credenciais inválidas");
  },
};

// ---------- factory: CRUD module that auto-falls back to localDB ----------
function makeCrud(resource) {
  const local = localDB(resource);
  return {
    list: () => safe(api.get(`/${resource}`), () => local.list()),
    get: (id) => safe(api.get(`/${resource}/${id}`), () => local.get(id)),
    create: async (data) => {
      try {
        const res = await api.post(`/${resource}`, data);
        const created = res.data || data;
        local.upsert(created); // mirror locally
        return created;
      } catch {
        return local.create(data);
      }
    },
    update: async (id, data) => {
      try {
        const res = await api.put(`/${resource}/${id}`, data);
        const updated = res.data || { id, ...data };
        local.upsert(updated);
        return updated;
      } catch {
        return local.update(id, data);
      }
    },
    remove: async (id) => {
      try {
        await api.delete(`/${resource}/${id}`);
      } catch { /* fallthrough */ }
      local.remove(id);
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
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tipo", tipo);
      const res = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch {
      // Fallback: convert to base64 and store as data URL
      const dataUrl = await fileToDataURL(file);
      return { url: dataUrl, name: file.name, tipo, source: "local" };
    }
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
