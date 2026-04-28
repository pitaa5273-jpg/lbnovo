import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { financeiroService } from "../services/api";
import { Modal, Inp } from "./Clientes";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, FileDown } from "lucide-react";
import { toast } from "sonner";
import { brl, fmtDate, todayISO } from "../lib/format";
import { gerarPDF_Relatorio } from "../lib/pdf";
import { useCompany } from "../contexts/CompanyContext";

export default function Financeiro() {
  const { empresa } = useCompany();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => financeiroService.list().then((d) => setItems(Array.isArray(d) ? d : []));
  useEffect(() => { load(); }, []);

  const startNew = (tipo) => { setEditing({ tipo, valor: 0, descricao: "", categoria: "", data: todayISO() }); setOpen(true); };
  const save = async () => {
    if (!editing.descricao) return toast.error("Descrição obrigatória");
    const data = { ...editing, valor: Number(editing.valor || 0) };
    if (editing.id) await financeiroService.update(editing.id, data);
    else await financeiroService.create(data);
    toast.success("Lançamento salvo"); setOpen(false); load();
  };
  const remove = async (it) => {
    if (!window.confirm("Excluir lançamento?")) return;
    await financeiroService.remove(it.id); toast.success("Removido"); load();
  };

  const entradas = items.filter((x) => x.tipo === "entrada").reduce((a, x) => a + Number(x.valor || 0), 0);
  const saidas = items.filter((x) => x.tipo === "saida").reduce((a, x) => a + Number(x.valor || 0), 0);
  const saldo = entradas - saidas;

  const exportPDF = () => {
    gerarPDF_Relatorio({
      empresa, titulo: "RELATÓRIO FINANCEIRO",
      colunas: ["Data", "Tipo", "Descrição", "Categoria", "Valor"],
      linhas: items.map((l) => [fmtDate(l.data || l.createdAt), (l.tipo || "").toUpperCase(), l.descricao, l.categoria || "—", brl(l.valor)]),
      totais: [{ label: "Entradas", value: entradas }, { label: "Saídas", value: saidas }, { label: "Saldo", value: saldo }],
    });
  };

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Controle de entradas, saídas e lucro da oficina."
        actions={
          <div className="flex gap-2">
            <button data-testid="fin-new-entrada" className="lb-btn-ghost" onClick={() => startNew("entrada")}><TrendingUp className="h-4 w-4 inline mr-1 text-[#4ade80]" />Entrada</button>
            <button data-testid="fin-new-saida" className="lb-btn-ghost" onClick={() => startNew("saida")}><TrendingDown className="h-4 w-4 inline mr-1 text-[#f87171]" />Saída</button>
            <button className="lb-btn-primary" onClick={exportPDF}><FileDown className="h-4 w-4 inline mr-1" />Relatório PDF</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SmallStat icon={TrendingUp} color="green" label="Entradas" value={brl(entradas)} />
        <SmallStat icon={TrendingDown} color="red" label="Saídas" value={brl(saidas)} />
        <SmallStat icon={Wallet} color="orange" label="Saldo" value={brl(saldo)} />
      </div>

      <div className="lb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="lb-table">
            <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th className="text-right">Valor</th><th /></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-zinc-500">Sem lançamentos ainda.</td></tr>}
              {[...items].sort((a, b) => new Date(b.data || b.createdAt) - new Date(a.data || a.createdAt)).map((it) => (
                <tr key={it.id}>
                  <td>{fmtDate(it.data || it.createdAt)}</td>
                  <td><span className={`lb-badge ${it.tipo === "entrada" ? "lb-badge-green" : "lb-badge-red"}`}>{it.tipo}</span></td>
                  <td>{it.descricao}</td>
                  <td>{it.categoria || "—"}</td>
                  <td className={`text-right font-mono ${it.tipo === "entrada" ? "text-[#4ade80]" : "text-[#f87171]"}`}>{it.tipo === "entrada" ? "+" : "−"} {brl(it.valor)}</td>
                  <td><button className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-red-400" onClick={() => remove(it)}><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title={`Novo lançamento — ${editing.tipo}`} onClose={() => setOpen(false)}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Inp label="Descrição *" testid="fin-form-desc" value={editing.descricao} onChange={(v) => setEditing({ ...editing, descricao: v })} />
            <Inp label="Valor (R$)" type="number" step="0.01" testid="fin-form-valor" value={editing.valor} onChange={(v) => setEditing({ ...editing, valor: v })} />
            <Inp label="Categoria" value={editing.categoria} onChange={(v) => setEditing({ ...editing, categoria: v })} placeholder="OS, peças, despesa fixa..." />
            <Inp label="Data" type="date" value={editing.data} onChange={(v) => setEditing({ ...editing, data: v })} />
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button className="lb-btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button data-testid="fin-form-save" className="lb-btn-primary" onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SmallStat({ icon: Icon, color, label, value }) {
  const map = {
    green: "text-[#4ade80] border-[#0f3a1d] bg-[#06160c]",
    red: "text-[#f87171] border-[#3a0f0f] bg-[#160606]",
    orange: "text-[#ff6600] border-[#3a1d08] bg-[#1a0f06]",
  }[color];
  return (
    <div className="lb-card lb-stat-card p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-lg border flex items-center justify-center ${map}`}><Icon className="h-5 w-5" /></div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{label}</div>
        <div className="font-display text-2xl text-zinc-100">{value}</div>
      </div>
    </div>
  );
}
