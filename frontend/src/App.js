import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";

import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import ConnectionBanner from "@/components/ConnectionBanner";
import { wakeUp } from "@/services/api";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Empresa from "@/pages/Empresa";
import Clientes from "@/pages/Clientes";
import Veiculos from "@/pages/Veiculos";
import OrdensServico from "@/pages/OrdensServico";
import Orcamentos from "@/pages/Orcamentos";
import { Servicos, Pecas } from "@/pages/Catalogos";
import Garantias from "@/pages/Garantias";
import Financeiro from "@/pages/Financeiro";
import Fechamento from "@/pages/Fechamento";
import Backup from "@/pages/Backup";

function Shell({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  // Wake the Render server up as soon as the app loads so the first
  // login/CRUD call doesn't time out on a cold start.
  useEffect(() => { wakeUp(); }, []);

  return (
    <AuthProvider>
      <CompanyProvider>
        <BrowserRouter>
          <ConnectionBanner />
          <Toaster theme="dark" position="top-right" richColors closeButton />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
            <Route path="/empresa" element={<Shell><Empresa /></Shell>} />
            <Route path="/clientes" element={<Shell><Clientes /></Shell>} />
            <Route path="/veiculos" element={<Shell><Veiculos /></Shell>} />
            <Route path="/os" element={<Shell><OrdensServico /></Shell>} />
            <Route path="/orcamentos" element={<Shell><Orcamentos /></Shell>} />
            <Route path="/servicos" element={<Shell><Servicos /></Shell>} />
            <Route path="/pecas" element={<Shell><Pecas /></Shell>} />
            <Route path="/garantias" element={<Shell><Garantias /></Shell>} />
            <Route path="/financeiro" element={<Shell><Financeiro /></Shell>} />
            <Route path="/fechamento" element={<Shell><Fechamento /></Shell>} />
            <Route path="/backup" element={<Shell><Backup /></Shell>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
