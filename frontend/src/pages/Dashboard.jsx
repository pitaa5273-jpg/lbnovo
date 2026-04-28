import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { osService, financeiroService, clientesService, veiculosService } from "../services/api";
import { brl, fmtDate } from "../lib/format";
import {
  ClipboardList, CheckCircle2, Clock, TrendingUp, TrendingDown,
  Wallet, Users, Car,
} from "lucide-react";
import { Link } from "react-router-dom";

function StatCard({ icon: Icon, label, value, accent = "orange", testid }) {
  const palette = {
    orange: "text-[#ff6600] border-[#3a1d08] bg-[#1a0f06]",
    gold: "text-[#d4af37] border-[#3a2d08] bg-[#1a1506]",
    green: "text-[#4ade80] border-[#0f3a1d] bg-[#06160c]",
    red: "text-[#f87171] border-[#3a0f0f] bg-[#160606]",
  }[accent];
  return (
    <div data-testid={testid} className="lb-card lb-stat-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{label}</div>
          <div className="font-display text-3xl mt-2 text-zinc-100">{value}</div>
        </div>
        <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${palette}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [os, setOs] = useState([]);
  const [fin, setFin] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);

  useEffect(() => {
    Promise.all([
      osService.list(), financeiroService.list(),
      clientesService.list(), veiculosService.list(),
    ]).then(([o, f, c, v]) => {
      setOs(Array.isArray(o) ? o : []);
      setFin(Array.isArray(f) ? f : []);
      setClientes(Array.isArray(c) ? c : []);
      setVeiculos(Array.isArray(v) ? v : []);
    });
  }, []);

  const abertas = os.filter((x) => (x.status || "aberta").toLowerCase() === "aberta").length;
  const andamento = os.filter((x) => (x.status || "").toLowerCase() === "andamento").length;
  const finalizadas = os.filter((x) => (x.status || "").toLowerCase() === "finalizada").length;

  const entradas = fin.filter((x) => x.tipo === "entrada").reduce((a, x) => a + Number(x.valor || 0), 0);
  const saidas = fin.filter((x) => x.tipo === "saida").reduce((a, x) => a + Number(x.valor || 0), 0);
  const saldo = entradas - saidas;

  const recentOS = [...os].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Visão Geral"
        subtitle="Resumo das operações da oficina, faturamento e atividades recentes."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard testid="stat-os-abertas" icon={ClipboardList} label="OS Abertas" value={abertas} accent="orange" />
        <StatCard testid="stat-os-andamento" icon={Clock} label="Em Andamento" value={andamento} accent="gold" />
        <StatCard testid="stat-os-finalizadas" icon={CheckCircle2} label="Finalizadas" value={finalizadas} accent="green" />
        <StatCard testid="stat-saldo" icon={Wallet} label="Saldo do Caixa" value={brl(saldo)} accent={saldo >= 0 ? "green" : "red"} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <StatCard icon={TrendingUp} label="Entradas" value={brl(entradas)} accent="green" />
        <StatCard icon={TrendingDown} label="Saídas" value={brl(saidas)} accent="red" />
        <StatCard icon={Users} label="Clientes" value={clientes.length} accent="gold" />
        <StatCard icon={Car} label="Veículos" value={veiculos.length} accent="orange" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-8">
        <div className="lg:col-span-2 lb-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">Atividades</div>
              <h3 className="font-display text-xl text-zinc-100">Últimas Ordens de Serviço</h3>
            </div>
            <Link to="/os" className="lb-btn-ghost text-sm">Ver todas</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="lb-table">
              <thead>
                <tr><th>Nº</th><th>Cliente</th><th>Veículo</th><th>Status</th><th>Valor</th><th>Data</th></tr>
              </thead>
              <tbody>
                {recentOS.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-zinc-500 py-8">Nenhuma OS cadastrada ainda.</td></tr>
                )}
                {recentOS.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-[#d4af37]">#{o.numero || String(o.id).slice(-4)}</td>
                    <td>{o.clienteNome || "—"}</td>
                    <td>{o.veiculoLabel || "—"}</td>
                    <td>
                      <span className={`lb-badge ${
                        (o.status || "aberta") === "aberta" ? "lb-badge-orange" :
                        o.status === "andamento" ? "lb-badge-gold" :
                        o.status === "finalizada" ? "lb-badge-green" : "lb-badge-gray"
                      }`}>{o.status || "aberta"}</span>
                    </td>
                    <td className="font-mono">{brl(o.valorTotal)}</td>
                    <td>{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lb-card p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">Resumo Financeiro</div>
          <h3 className="font-display text-xl text-zinc-100 mb-4">Movimento</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#0f3a1d] bg-[#06160c]">
              <span className="text-sm text-zinc-300">Entradas</span>
              <span className="font-mono text-[#4ade80]">{brl(entradas)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#3a0f0f] bg-[#160606]">
              <span className="text-sm text-zinc-300">Saídas</span>
              <span className="font-mono text-[#f87171]">{brl(saidas)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#3a1d08] bg-[#1a0f06]">
              <span className="text-sm text-zinc-300">Saldo</span>
              <span className="font-mono text-[#ff6600] font-bold">{brl(saldo)}</span>
            </div>
          </div>

          <Link to="/financeiro" className="lb-btn-primary mt-5 w-full text-center block">Ir para o Financeiro</Link>
        </div>
      </div>
    </div>
  );
}
