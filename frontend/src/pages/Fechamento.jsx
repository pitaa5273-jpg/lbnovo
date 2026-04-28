import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { financeiroService } from "../services/api";
import { brl, fmtDate } from "../lib/format";
import { FileDown } from "lucide-react";
import { gerarPDF_Fechamento } from "../lib/pdf";
import { useCompany } from "../contexts/CompanyContext";

const TABS = [
  { key: "diario", label: "Diário" },
  { key: "semanal", label: "Semanal" },
  { key: "mensal", label: "Mensal" },
];

function rangeFor(tab) {
  const now = new Date();
  const start = new Date(now);
  if (tab === "diario") {
    start.setHours(0, 0, 0, 0);
  } else if (tab === "semanal") {
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1); start.setHours(0, 0, 0, 0);
  }
  return { start, end: now, label: tab };
}

export default function Fechamento() {
  const { empresa } = useCompany();
  const [tab, setTab] = useState("diario");
  const [items, setItems] = useState([]);

  useEffect(() => { financeiroService.list().then((d) => setItems(Array.isArray(d) ? d : [])); }, []);

  const periodo = rangeFor(tab);
  const filtrados = useMemo(() => items.filter((it) => {
    const d = new Date(it.data || it.createdAt);
    return d >= periodo.start && d <= periodo.end;
  }), [items, periodo]);

  const entradas = filtrados.filter((x) => x.tipo === "entrada").reduce((a, x) => a + Number(x.valor || 0), 0);
  const saidas = filtrados.filter((x) => x.tipo === "saida").reduce((a, x) => a + Number(x.valor || 0), 0);
  const saldo = entradas - saidas;

  const exportPDF = () => {
    gerarPDF_Fechamento({
      empresa,
      periodo: { label: tab.toUpperCase(), inicio: periodo.start, fim: periodo.end },
      lancamentos: filtrados,
      totais: { entradas, saidas, saldo },
    });
  };

  return (
    <div>
      <PageHeader
        title="Fechamento de Caixa"
        subtitle="Acompanhe os totais por período e exporte o relatório."
        actions={<button className="lb-btn-primary" onClick={exportPDF}><FileDown className="h-4 w-4 inline mr-1" />Exportar PDF</button>}
      />

      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm border transition ${tab === t.key ? "bg-[#1a0f06] border-[#3a1d08] text-[#ff6600]" : "border-[#262626] text-zinc-300 hover:border-[#ff6600] hover:text-[#ff6600]"}`}
            data-testid={`fech-tab-${t.key}`}
          >{t.label}</button>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <Box label="Entradas" value={brl(entradas)} color="green" />
        <Box label="Saídas" value={brl(saidas)} color="red" />
        <Box label="Saldo" value={brl(saldo)} color="orange" />
      </div>

      <div className="lb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="lb-table">
            <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th className="text-right">Valor</th></tr></thead>
            <tbody>
              {filtrados.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-zinc-500">Sem lançamentos no período.</td></tr>}
              {filtrados.map((it) => (
                <tr key={it.id}>
                  <td>{fmtDate(it.data || it.createdAt)}</td>
                  <td><span className={`lb-badge ${it.tipo === "entrada" ? "lb-badge-green" : "lb-badge-red"}`}>{it.tipo}</span></td>
                  <td>{it.descricao}</td>
                  <td>{it.categoria || "—"}</td>
                  <td className={`text-right font-mono ${it.tipo === "entrada" ? "text-[#4ade80]" : "text-[#f87171]"}`}>{brl(it.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Box({ label, value, color }) {
  const map = {
    green: "border-[#0f3a1d] bg-[#06160c] text-[#4ade80]",
    red: "border-[#3a0f0f] bg-[#160606] text-[#f87171]",
    orange: "border-[#3a1d08] bg-[#1a0f06] text-[#ff6600]",
  }[color];
  return (
    <div className={`rounded-xl border p-5 ${map}`}>
      <div className="text-[10px] uppercase tracking-[0.2em] opacity-80">{label}</div>
      <div className="font-display text-3xl mt-1">{value}</div>
    </div>
  );
}
