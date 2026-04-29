import { createContext, useContext, useEffect, useState, useCallback } from "react";

// Empresa info (name, CNPJ, address, logo) is the only data we keep
// in localStorage — it's per-installation configuration, not user data.
const STORAGE_KEY = "lb_empresa";

const DEFAULT = {
  nome: "LB Mecânica Automotiva",
  cnpj: "",
  telefone: "",
  endereco: "",
  logo: "", // base64 data URL
};

function readEmpresa() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeEmpresa(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data || {}));
  } catch {
    /* ignore quota / private mode errors */
  }
}

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [empresa, setEmpresaState] = useState(() => readEmpresa() || DEFAULT);

  useEffect(() => { writeEmpresa(empresa); }, [empresa]);

  const update = useCallback((data) => {
    setEmpresaState((prev) => ({ ...prev, ...data }));
  }, []);

  return (
    <CompanyContext.Provider value={{ empresa, update }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
