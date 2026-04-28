import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { clientesService } from "../services/api";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "../lib/format";

export default function Clientes() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");

  const load = () => clientesService.list().then((d) => setItems(Array.isArray(d) ? d : []));
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing({ nome: "", documento: "", telefone: "", email: "", endereco: "" }); setOpen(true); };
  const startEdit = (c) => { setEditing({ ...c }); setOpen(true); };

  const save = async () => {
    if (!editing.nome) return toast.error("Nome obrigatório");
    if (editing.id) await clientesService.update(editing.id, editing);
    else await clientesService.create(editing);
    toast.success("Cliente salvo");
    setOpen(false); setEditing(null); load();
  };
  const remove = async (c) => {
    if (!window.confirm(`Excluir cliente ${c.nome}?`)) return;
    await clientesService.remove(c.id);
    toast.success("Cliente removido"); load();
  };

  const filtered = items.filter((c) =>
    !q || (c.nome || "").toLowerCase().includes(q.toLowerCase())
    || (c.documento || "").includes(q) || (c.telefone || "").includes(q)
  );

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Cadastre e gerencie todos os clientes da oficina."
        actions={
          <button data-testid="cliente-new" className="lb-btn-primary" onClick={startNew}>
            <Plus className="h-4 w-4 inline mr-2" />Novo Cliente
          </button>
        }
      />

      <div className="lb-card overflow-hidden">
        <div className="p-4 border-b border-[#1c1c1c] flex items-center gap-3">
          <Search className="h-4 w-4 text-zinc-500" />
          <input data-testid="cliente-search" className="lb-input !py-2" placeholder="Buscar por nome, documento ou telefone..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="lb-table">
            <thead><tr><th>Nome</th><th>Documento</th><th>Telefone</th><th>E-mail</th><th>Cadastro</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-zinc-500">Nenhum cliente encontrado.</td></tr>}
              {filtered.map((c) => (
                <tr key={c.id} data-testid={`cliente-row-${c.id}`}>
                  <td className="font-medium text-zinc-100">{c.nome}</td>
                  <td>{c.documento || "—"}</td>
                  <td>{c.telefone || "—"}</td>
                  <td>{c.email || "—"}</td>
                  <td>{fmtDate(c.createdAt)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-[#ff6600]" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></button>
                      <button data-testid={`cliente-delete-${c.id}`} className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-red-400" onClick={() => remove(c)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title={editing.id ? "Editar Cliente" : "Novo Cliente"} onClose={() => setOpen(false)}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Inp label="Nome *" value={editing.nome} testid="cliente-form-nome" onChange={(v) => setEditing({ ...editing, nome: v })} />
            <Inp label="CPF / CNPJ" value={editing.documento} onChange={(v) => setEditing({ ...editing, documento: v })} />
            <Inp label="Telefone" value={editing.telefone} testid="cliente-form-telefone" onChange={(v) => setEditing({ ...editing, telefone: v })} />
            <Inp label="E-mail" value={editing.email} onChange={(v) => setEditing({ ...editing, email: v })} />
            <Inp label="Endereço" value={editing.endereco} className="sm:col-span-2" onChange={(v) => setEditing({ ...editing, endereco: v })} />
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button className="lb-btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button data-testid="cliente-form-save" className="lb-btn-primary" onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className={`lb-card p-6 w-full ${wide ? "max-w-4xl" : "max-w-2xl"} relative my-8`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-2xl text-zinc-100">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-[#ff6600]">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Inp({ label, value, onChange, type = "text", className = "", testid, placeholder, step }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">{label}</div>
      <input data-testid={testid} className="lb-input" type={type} value={value || ""} step={step} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
