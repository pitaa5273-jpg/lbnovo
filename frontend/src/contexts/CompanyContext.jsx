import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getEmpresa, setEmpresa } from "../services/localDB";

const CompanyContext = createContext(null);

const DEFAULT = {
  nome: "LB Mecânica Automotiva",
  cnpj: "",
  telefone: "",
  endereco: "",
  logo: "", // base64 data URL
};

export function CompanyProvider({ children }) {
  const [empresa, setEmpresaState] = useState(() => getEmpresa() || DEFAULT);

  useEffect(() => { setEmpresa(empresa); }, [empresa]);

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
