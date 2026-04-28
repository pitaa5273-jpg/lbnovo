import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  orcamentosService, clientesService, veiculosService,
  servicosService, pecasService, osService,
} from "../services/api";
import { Plus, Pencil, Trash2, FileDown, Send } from "lucide-react";
import { toast } from "sonner";
import { brl, fmtDate, todayISO } from "../lib/format";
import { gerarPDF_Orcamento } from "../lib/pdf";
import { useCompany } from "../contexts/CompanyContext";
import { OSForm } from "./OrdensServico";

export default function Orcamentos() {
  const { empresa } = useCompany();
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [pecas, setPecas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [o, c, v, s, p] = await Promise.all([
      orcamentosService.list(), clientesService.list(), veiculosService.list(),
      servicosService.list(), pecasService.list(),
    ]);
    setItems(Array.isArray(o) ? o : []);
    setClientes(Array.isArray(c) ? c : []);
    setVeiculos(Array.isArray(v) ? v : []);
    setServicos(Array.isArray(s) ? s : []);
    setPecas(Array.isArray(p) ? p : []);
  };
  useEffect(() => { load(); }, []);

  const blank = () => ({
    numero: `ORC-${Date.now().toString().slice(-6)}`,
    clienteId: "", veiculoId: "", descricao: "", status: "pendente",
    servicos: [], pecas: [], data: todayISO(), validade: "",
  });

  const startNew = () => { setEditing(blank()); setOpen(true); };
  const startEdit = (it) => { setEditing({ ...it, servicos: it.servicos || [], pecas: it.pecas || [] }); setOpen(true); };

  const save = async () => {
    const cli = clientes.find((c) => c.id === editing.clienteId);
    const vei = veiculos.find((v) => v.id === editing.veiculoId);
    const valorTotal =
      (editing.servicos || []).reduce((a, s) => a + Number(s.valor || 0) * Number(s.quantidade || 1), 0) +
      (editing.pecas || []).reduce((a, p) => a + Number(p.valor || 0) * Number(p.quantidade || 1), 0);
    const data = { ...editing, clienteNome: cli?.nome, veiculoLabel: vei ? `${vei.marca} ${vei.modelo} (${vei.placa})` : "", valorTotal };
    if (editing.id) await orcamentosService.update(editing.id, data); else await orcamentosService.create(data);
    toast.success("Orçamento salvo"); setOpen(false); load();
  };
  const remove = async (it) => {
    if (!window.confirm(`Excluir orçamento ${it.numero}?`)) return;
    await orcamentosService.remove(it.id); toast.success("Removido"); load();
  };
  const exportPDF = (it) => {
    const cliente = clientes.find((c) => c.id === it.clienteId);
    const veiculo = veiculos.find((v) => v.id === it.veiculoId);
    gerarPDF_Orcamento({ empresa, orcamento: it, cliente, veiculo });
  };
  const converter = async (it) => {
    if (!window.confirm(`Converter o orçamento ${it.numero} em uma OS?`)) return;
    const numero = `OS-${Date.now().toString().slice(-6)}`;
    await osService.create({
      numero, clienteId: it.clienteId, clienteNome: it.clienteNome,
      veiculoId: it.veiculoId, veiculoLabel: it.veiculoLabel,
      descricao: it.descricao, servicos: it.servicos, pecas: it.pecas,
      status: "aberta", valorTotal: it.valorTotal, fotos: [],
      dataAbertura: todayISO(), origemOrcamentoId: it.id,
    });
    await orcamentosService.update(it.id, { ...it, status: "convertido" });
    toast.success(`Orçamento convertido na OS ${numero}`); load();
  };

  return (
    <div>
      <PageHeader title="Orçamentos" subtitle="Crie orçamentos e converta em ordens de serviço."
        actions={<button data-testid="orc-new" className="lb-btn-primary" onClick={startNew}><Plus className="h-4 w-4 inline mr-2" />Novo Orçamento</button>}
      />
      <div className="lb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="lb-table">
            <thead><tr><th>Nº</th><th>Cliente</th><th>Veículo</th><th>Status</th><th>Validade</th><th>Valor</th><th></th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-zinc-500">Nenhum orçamento.</td></tr>}
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="font-mono text-[#d4af37]">{it.numero}</td>
                  <td>{it.clienteNome}</td>
                  <td>{it.veiculoLabel}</td>
                  <td><span className={`lb-badge ${it.status === "convertido" ? "lb-badge-green" : it.status === "aprovado" ? "lb-badge-gold" : "lb-badge-orange"}`}>{it.status}</span></td>
                  <td>{fmtDate(it.validade)}</td>
                  <td className="font-mono">{brl(it.valorTotal)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button title="PDF" className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-[#d4af37]" onClick={() => exportPDF(it)}><FileDown className="h-4 w-4" /></button>
                      <button title="Converter em OS" className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-[#4ade80]" onClick={() => converter(it)}><Send className="h-4 w-4" /></button>
                      <button title="Editar" className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-[#ff6600]" onClick={() => startEdit(it)}><Pencil className="h-4 w-4" /></button>
                      <button title="Excluir" className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-red-400" onClick={() => remove(it)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <OSForm
          editing={editing} setEditing={setEditing}
          clientes={clientes} veiculos={veiculos} servicos={servicos} pecas={pecas}
          onClose={() => setOpen(false)} onSave={save} titulo="Orçamento"
        />
      )}
    </div>
  );
}
