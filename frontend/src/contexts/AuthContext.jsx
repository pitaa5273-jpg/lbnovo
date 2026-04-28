import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("lb_token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lb_user") || "null"); }
    catch { return null; }
  });

  useEffect(() => {
    if (token) localStorage.setItem("lb_token", token);
    else localStorage.removeItem("lb_token");
  }, [token]);

  const login = useCallback(async (usuario, senha) => {
    const res = await authService.login(usuario, senha);
    setToken(res.token);
    const u = { usuario, source: res.source };
    setUser(u);
    localStorage.setItem("lb_user", JSON.stringify(u));
    return res;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("lb_user");
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
