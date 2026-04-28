import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Car, ClipboardList, FileText, Wrench,
  ShieldCheck, Wallet, BarChart3, DatabaseBackup, Building2, LogOut, Package,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCompany } from "../contexts/CompanyContext";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/clientes", icon: Users, label: "Clientes" },
  { to: "/veiculos", icon: Car, label: "Veículos" },
  { to: "/os", icon: ClipboardList, label: "Ordens de Serviço" },
  { to: "/orcamentos", icon: FileText, label: "Orçamentos" },
  { to: "/servicos", icon: Wrench, label: "Serviços" },
  { to: "/pecas", icon: Package, label: "Peças" },
  { to: "/garantias", icon: ShieldCheck, label: "Garantias" },
  { to: "/financeiro", icon: Wallet, label: "Financeiro" },
  { to: "/fechamento", icon: BarChart3, label: "Fechamento de Caixa" },
  { to: "/backup", icon: DatabaseBackup, label: "Backup" },
  { to: "/empresa", icon: Building2, label: "Empresa" },
];

export default function Layout({ children }) {
  const { logout } = useAuth();
  const { empresa } = useCompany();
  const navigate = useNavigate();
  const loc = useLocation();
  const current = NAV.find((n) => loc.pathname.startsWith(n.to))?.label || "LB Mecânica";

  return (
    <div className="lb-app flex min-h-screen text-zinc-100">
      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[#1e1e1e] bg-[#0c0c0c]"
      >
        <div className="px-5 py-5 flex items-center gap-3 border-b border-[#1e1e1e]">
          {empresa?.logo ? (
            <img src={empresa.logo} alt="logo" className="h-10 w-10 rounded-lg object-cover border border-[#262626]" />
          ) : (
            <div className="h-10 w-10 rounded-lg flex items-center justify-center font-display text-lg bg-gradient-to-br from-[#ff6600] to-[#d4af37] text-black">
              LB
            </div>
          )}
          <div className="leading-tight">
            <div className="font-display text-lg tracking-wide text-zinc-100">LB MECÂNICA</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">Automotiva</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={`nav-${to.replace("/", "")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-[#1a0f06] text-[#ff6600] border border-[#3a1d08]"
                    : "text-zinc-300 hover:text-[#ff6600] hover:bg-[#141414]"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          data-testid="logout-button"
          onClick={() => { logout(); navigate("/login"); }}
          className="m-3 flex items-center justify-center gap-2 rounded-lg border border-[#262626] py-2.5 text-sm text-zinc-300 hover:text-[#ff6600] hover:border-[#ff6600] transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e] bg-[#0e0e0e]/80 backdrop-blur-md">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37]">Painel</div>
            <h1 className="font-display text-2xl text-zinc-100" data-testid="page-title">{current}</h1>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-xs text-zinc-400">{empresa?.nome || "LB Mecânica"}</div>
              <div className="text-[10px] text-[#d4af37]">{empresa?.cnpj || "Configure CNPJ"}</div>
            </div>
            {empresa?.logo ? (
              <img src={empresa.logo} alt="logo" className="h-9 w-9 rounded-md object-cover border border-[#262626]" />
            ) : (
              <div className="h-9 w-9 rounded-md flex items-center justify-center text-xs bg-[#1a1a1a] text-[#d4af37] border border-[#262626]">LB</div>
            )}
          </div>
        </header>

        {/* Mobile nav */}
        <div className="lg:hidden flex overflow-x-auto gap-2 px-3 py-2 border-b border-[#1e1e1e] bg-[#0c0c0c]">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-md text-xs whitespace-nowrap border ${
                  isActive ? "border-[#ff6600] text-[#ff6600] bg-[#1a0f06]" : "border-[#262626] text-zinc-300"
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </NavLink>
          ))}
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 lb-anim-in">{children}</main>
      </div>
    </div>
  );
}
