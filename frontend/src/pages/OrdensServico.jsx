import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  osService, clientesService, veiculosService,
  servicosService, pecasService, uploadService, fileToDataURL,
  garantiasService, financeiroService,
} from "../services/api";
import { Modal, Inp } from "./Clientes";
import { Plus, Pencil, Trash2, FileDown, ShieldCheck, Camera, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { brl, fmtDate } from "../lib/format";
import { gerarPDF_OS } from "../lib/pdf";
import { useCompany } from "../contexts/CompanyContext";

const STATUS = ["aberta", "andamento", "finalizada", "cancelada"];
const FOTO_TIPOS = ["chegada", "manutencao", "saida"];

export default function OrdensServico() {
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
      osService.list(), clientesService.list(), veiculosService.list(),
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
    numero: `OS-${Date.now().toString().slice(-6)}`,
    clienteId: "", veiculoId: "", descricao: "", status: "aberta",
    servicos: [], pecas: [], fotos: [], dataAbertura: new Date().toISOString().slice(0, 10),
  });

  const startNew = () => { setEditing(blank()); setOpen(true); };
  const startEdit = (it) => { setEditing({ ...it, servicos: it.servicos || [], pecas: it.pecas || [], fotos: it.fotos || [] }); setOpen(true); };

  const save = async () => {
    const cli = clientes.find((c) => c.id === editing.clienteId);
    const vei = veiculos.find((v) => v.id === editing.veiculoId);
    const valorTotal = computeTotal(editing);
    const data = {
      ...editing,
      clienteNome: cli?.nome || "",
      veiculoLabel: vei ? `${vei.marca || ""} ${vei.modelo || ""} (${vei.placa || ""})`.trim() : "",
      valorTotal,
    };
    if (editing.id) await osService.update(editing.id, data); else await osService.create(data);
    toast.success("OS salva"); setOpen(false); load();
  };

  const remove = async (it) => {
    if (!window.confirm(`Excluir OS ${it.numero}?`)) return;
    await osService.remove(it.id); toast.success("OS removida"); load();
  };

  const exportPDF = (it) => {
    const cliente = clientes.find((c) => c.id === it.clienteId);
    const veiculo = veiculos.find((v) => v.id === it.veiculoId);
    gerarPDF_OS({ empresa, os: it, cliente, veiculo });
  };

  const gerarGarantia = async (it) => {
    const prazo = Number(window.prompt("Prazo de garantia (em dias)?", "90"));
    if (!prazo) return;
    const inicio = new Date(); const fim = new Date(); fim.setDate(fim.getDate() + prazo);
    const cli = clientes.find((c) => c.id === it.clienteId);
    const vei = veiculos.find((v) => v.id === it.veiculoId);
    await garantiasService.create({
      numero: `GAR-${Date.now().toString().slice(-6)}`,
      osId: it.id, osNumero: it.numero,
      clienteId: it.clienteId, clienteNome: cli?.nome,
      veiculoId: it.veiculoId, veiculoLabel: vei ? `${vei.marca} ${vei.modelo} (${vei.placa})` : "",
      prazo, inicio: inicio.toISOString(), fim: fim.toISOString(),
      servicos: it.servicos || [],
      pecas: it.pecas || [],
      descricao: it.descricao || "",
      valorTotal: it.valorTotal || 0,
      itens: [...(it.servicos || []), ...(it.pecas || [])].map((x) => ({ descricao: x.nome })),
    });
    toast.success("Garantia gerada");
  };

  const finalizar = async (it) => {
    const total = computeTotal(it);
    await osService.update(it.id, { ...it, status: "finalizada", valorTotal: total, dataFim: new Date().toISOString() });
    await financeiroService.create({
      tipo: "entrada", valor: total,
      descricao: `Recebimento OS ${it.numero}`,
      categoria: "OS", osId: it.id, data: new Date().toISOString().slice(0, 10),
    });
    toast.success("OS finalizada e lançada no financeiro");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Ordens de Serviço"
        subtitle="Crie e acompanhe as OS, peças, serviços e fotos do veículo."
        actions={<button data-testid="os-new" className="lb-btn-primary" onClick={startNew}><Plus className="h-4 w-4 inline mr-2" />Nova OS</button>}
      />

      <div className="lb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="lb-table">
            <thead><tr><th>Nº</th><th>Cliente</th><th>Veículo</th><th>Status</th><th>Valor</th><th>Abertura</th><th></th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-zinc-500">Nenhuma OS criada.</td></tr>}
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="font-mono text-[#d4af37]">{it.numero}</td>
                  <td>{it.clienteNome || "—"}</td>
                  <td>{it.veiculoLabel || "—"}</td>
                  <td><span className={`lb-badge ${it.status === "aberta" ? "lb-badge-orange" : it.status === "andamento" ? "lb-badge-gold" : it.status === "finalizada" ? "lb-badge-green" : "lb-badge-red"}`}>{it.status}</span></td>
                  <td className="font-mono">{brl(it.valorTotal)}</td>
                  <td>{fmtDate(it.dataAbertura || it.createdAt)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button title="PDF" className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-[#d4af37]" onClick={() => exportPDF(it)}><FileDown className="h-4 w-4" /></button>
                      <button title="Garantia" className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-[#4ade80]" onClick={() => gerarGarantia(it)}><ShieldCheck className="h-4 w-4" /></button>
                      <button title="Editar" className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-[#ff6600]" onClick={() => startEdit(it)}><Pencil className="h-4 w-4" /></button>
                      <button title="Excluir" className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-red-400" onClick={() => remove(it)}><Trash2 className="h-4 w-4" /></button>
                      {it.status !== "finalizada" && (
                        <button title="Finalizar" className="px-2 text-xs text-[#4ade80] border border-[#0f3a1d] rounded hover:bg-[#0a1a10]" onClick={() => finalizar(it)}>FINALIZAR</button>
                      )}
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
          clientes={clientes} veiculos={veiculos}
          servicos={servicos} pecas={pecas}
          onClose={() => setOpen(false)} onSave={save}
        />
      )}
    </div>
  );
}

function computeTotal(os) {
  const ts = (os.servicos || []).reduce((a, s) => a + Number(s.valor || 0) * Number(s.quantidade || 1), 0);
  const tp = (os.pecas || []).reduce((a, p) => a + Number(p.valor || 0) * Number(p.quantidade || 1), 0);
  return ts + tp;
}

export function OSForm({ editing, setEditing, clientes, veiculos, servicos, pecas, onClose, onSave, titulo = "Ordem de Serviço" }) {
  const veiculosCli = useMemo(() => veiculos.filter((v) => !editing.clienteId || v.clienteId === editing.clienteId), [veiculos, editing.clienteId]);
  const total = computeTotal(editing);

  const addServico = (sId) => {
    const s = servicos.find((x) => x.id === sId); if (!s) return;
    setEditing({ ...editing, servicos: [...(editing.servicos || []), { id: `ln-${Date.now()}`, nome: s.nome, valor: s.valor, quantidade: 1, refId: s.id }] });
  };
  const addPeca = (pId) => {
    const p = pecas.find((x) => x.id === pId); if (!p) return;
    setEditing({ ...editing, pecas: [...(editing.pecas || []), { id: `ln-${Date.now()}`, nome: p.nome, valor: p.valor, quantidade: 1, refId: p.id }] });
  };
  const updateLine = (key, idx, field, value) => {
    const arr = [...(editing[key] || [])]; arr[idx] = { ...arr[idx], [field]: value };
    setEditing({ ...editing, [key]: arr });
  };
  const removeLine = (key, idx) => {
    const arr = [...(editing[key] || [])]; arr.splice(idx, 1); setEditing({ ...editing, [key]: arr });
  };

  const onUpload = async (e, tipo) => {
    const files = Array.from(e.target.files || []);
    const newItems = [];
    for (const f of files) {
      try {
        const res = await uploadService.upload(f, tipo);
        newItems.push({ id: `f-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, url: res.url || (await fileToDataURL(f)), nome: res.name || f.name, tipo });
      } catch {
        const url = await fileToDataURL(f);
        newItems.push({ id: `f-${Date.now()}`, url, nome: f.name, tipo });
      }
    }
    setEditing({ ...editing, fotos: [...(editing.fotos || []), ...newItems] });
    e.target.value = "";
  };
  const removeFoto = (id) => setEditing({ ...editing, fotos: (editing.fotos || []).filter((f) => f.id !== id) });

  return (
    <Modal title={`${titulo} ${editing.numero ? `— ${editing.numero}` : ""}`} onClose={onClose} wide>
      <div className="grid lg:grid-cols-3 gap-3">
        <label className="block">
          <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Cliente</div>
          <select data-testid="os-form-cliente" className="lb-input" value={editing.clienteId} onChange={(e) => setEditing({ ...editing, clienteId: e.target.value, veiculoId: "" })}>
            <option value="">— Selecione —</option>
            {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
        </label>
        <label className="block">
          <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Veículo</div>
          <select data-testid="os-form-veiculo" className="lb-input" value={editing.veiculoId} onChange={(e) => setEditing({ ...editing, veiculoId: e.target.value })}>
            <option value="">— Selecione —</option>
            {veiculosCli.map((v) => (<option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>))}
          </select>
        </label>
        <label className="block">
          <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Status</div>
          <select className="lb-input" value={editing.status || "aberta"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <label className="block mt-3">
        <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Descrição / Diagnóstico</div>
        <textarea data-testid="os-form-descricao" rows={3} className="lb-input" value={editing.descricao || ""} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} placeholder="Descreva o problema, observações e diagnóstico" />
      </label>

      <Section title="Serviços">
        <div className="flex items-center gap-2 mb-2">
          <select className="lb-input flex-1" defaultValue="" onChange={(e) => { if (e.target.value) { addServico(e.target.value); e.target.value = ""; } }}>
            <option value="">+ Adicionar serviço do catálogo</option>
            {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome} — {brl(s.valor)}</option>)}
          </select>
          <button className="lb-btn-ghost text-sm" onClick={() => setEditing({ ...editing, servicos: [...(editing.servicos || []), { id: `ln-${Date.now()}`, nome: "", valor: 0, quantidade: 1 }] })}>+ Avulso</button>
        </div>
        <LineTable rows={editing.servicos || []} onChange={(idx, field, value) => updateLine("servicos", idx, field, value)} onRemove={(idx) => removeLine("servicos", idx)} />
      </Section>

      <Section title="Peças">
        <div className="flex items-center gap-2 mb-2">
          <select className="lb-input flex-1" defaultValue="" onChange={(e) => { if (e.target.value) { addPeca(e.target.value); e.target.value = ""; } }}>
            <option value="">+ Adicionar peça do catálogo</option>
            {pecas.map((p) => <option key={p.id} value={p.id}>{p.nome} — {brl(p.valor)}</option>)}
          </select>
          <button className="lb-btn-ghost text-sm" onClick={() => setEditing({ ...editing, pecas: [...(editing.pecas || []), { id: `ln-${Date.now()}`, nome: "", valor: 0, quantidade: 1 }] })}>+ Avulso</button>
        </div>
        <LineTable rows={editing.pecas || []} onChange={(idx, field, value) => updateLine("pecas", idx, field, value)} onRemove={(idx) => removeLine("pecas", idx)} />
      </Section>

      <Section title="Fotos">
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          {FOTO_TIPOS.map((t) => (
            <label key={t} className="lb-card p-3 text-center cursor-pointer hover:border-[#ff6600] transition">
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onUpload(e, t)} />
              <Camera className="h-5 w-5 mx-auto text-[#ff6600]" />
              <div className="mt-1 text-xs uppercase tracking-wider text-zinc-300">{t}</div>
              <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1 mt-1"><Upload className="h-3 w-3" />Enviar</div>
            </label>
          ))}
        </div>
        {(editing.fotos || []).length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {(editing.fotos || []).map((f) => (
              <div key={f.id} className="relative group">
                <img src={f.url} alt={f.nome} className="h-24 w-full object-cover rounded-md border border-[#262626]" />
                <span className="absolute bottom-1 left-1 lb-badge lb-badge-orange text-[9px] !px-1.5 !py-0">{f.tipo}</span>
                <button onClick={() => removeFoto(f.id)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="flex items-center justify-between mt-5 pt-5 border-t border-[#1c1c1c]">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-400">Total</div>
          <div className="font-display text-3xl text-[#ff6600]">{brl(total)}</div>
        </div>
        <div className="flex gap-2">
          <button className="lb-btn-ghost" onClick={onClose}>Cancelar</button>
          <button data-testid="os-form-save" className="lb-btn-primary" onClick={onSave}>Salvar</button>
        </div>
      </div>
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#d4af37] mb-2">{title}</div>
      {children}
    </div>
  );
}

function LineTable({ rows, onChange, onRemove }) {
  if (!rows?.length) return <div className="text-xs text-zinc-500 italic">Nenhum item adicionado.</div>;
  return (
    <div className="overflow-x-auto rounded-md border border-[#1c1c1c]">
      <table className="lb-table">
        <thead><tr><th>Descrição</th><th className="!w-20">Qtd</th><th className="!w-32">Valor Unit.</th><th className="!w-32">Subtotal</th><th /></tr></thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.id || idx}>
              <td><input className="lb-input !py-1.5" value={r.nome} onChange={(e) => onChange(idx, "nome", e.target.value)} /></td>
              <td><input className="lb-input !py-1.5" type="number" min="1" value={r.quantidade ?? 1} onFocus={(e) => e.target.select()} onChange={(e) => onChange(idx, "quantidade", e.target.value === "" ? "" : Number(e.target.value))} /></td>
              <td><input className="lb-input !py-1.5" type="number" step="0.01" value={r.valor ?? 0} onFocus={(e) => e.target.select()} onChange={(e) => onChange(idx, "valor", e.target.value === "" ? "" : Number(e.target.value))} /></td>
              <td className="font-mono text-[#d4af37]">{brl(Number(r.valor || 0) * Number(r.quantidade || 1))}</td>
              <td><button className="text-zinc-400 hover:text-red-400" onClick={() => onRemove(idx)}><Trash2 className="h-4 w-4" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
