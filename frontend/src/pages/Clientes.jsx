import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import { clientesService } from "../services/api";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "../lib/format";

export default function Clientes() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

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
  const remove = (c) => {
    setConfirmDelete(c);
  };

  const confirmRemove = async () => {
    if (!confirmDelete) return;
    await clientesService.remove(confirmDelete.id);
    toast.success("Cliente removido");
    setConfirmDelete(null);
    load();
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
        <div className="p-3 sm:p-4 border-b border-[#1c1c1c] flex items-center gap-2 sm:gap-3">
          <Search className="h-4 w-4 text-zinc-500 flex-shrink-0" />
          <input data-testid="cliente-search" className="lb-input !py-2 text-sm" placeholder="Buscar por nome, documento ou telefone..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="lb-table">
            <thead><tr><th className="text-xs sm:text-sm">Nome</th><th className="text-xs sm:text-sm hidden sm:table-cell">Documento</th><th className="text-xs sm:text-sm hidden md:table-cell">Telefone</th><th className="text-xs sm:text-sm hidden lg:table-cell">E-mail</th><th className="text-xs sm:text-sm">Cadastro</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-zinc-500">Nenhum cliente encontrado.</td></tr>}
              {filtered.map((c) => (
                <tr key={c.id} data-testid={`cliente-row-${c.id}`}>
                  <td className="font-medium text-zinc-100 text-sm">{c.nome}</td>
                  <td className="hidden sm:table-cell text-sm">{c.documento || "—"}</td>
                  <td className="hidden md:table-cell text-sm">{c.telefone || "—"}</td>
                  <td className="hidden lg:table-cell text-sm">{c.email || "—"}</td>
                  <td className="text-sm">{fmtDate(c.createdAt)}</td>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Inp label="Nome *" value={editing.nome} testid="cliente-form-nome" required onChange={(v) => setEditing({ ...editing, nome: v })} />
            <Inp label="CPF / CNPJ" value={editing.documento} onChange={(v) => setEditing({ ...editing, documento: v })} />
            <Inp label="Telefone" value={editing.telefone} testid="cliente-form-telefone" type="tel" onChange={(v) => setEditing({ ...editing, telefone: v })} />
            <Inp label="E-mail" value={editing.email} type="email" onChange={(v) => setEditing({ ...editing, email: v })} />
            <Inp label="Endereço" value={editing.endereco} className="sm:col-span-2" onChange={(v) => setEditing({ ...editing, endereco: v })} />
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button className="lb-btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button data-testid="cliente-form-save" className="lb-btn-primary" onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Excluir Cliente"
          message={`Tem certeza que deseja excluir o cliente ${confirmDelete.nome}? Esta ação não pode ser desfeita.`}
          isDangerous
          onConfirm={confirmRemove}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

export function Modal({ title, children, onClose, wide = false }) {
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`lb-card p-4 sm:p-6 w-full ${wide ? "max-w-2xl sm:max-w-4xl" : "max-w-xl sm:max-w-2xl"} relative my-4 sm:my-8 max-h-[90vh] overflow-y-auto`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-inherit pb-2 border-b border-[#1c1c1c]">
          <h3 id="modal-title" className="font-display text-xl sm:text-2xl text-zinc-100 truncate">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-[#ff6600] ml-2 flex-shrink-0 text-xl"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Inp({ label, value, onChange, type = "text", className = "", testid, placeholder, step, required = false, pattern }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </div>
      <input 
        data-testid={testid} 
        className="lb-input" 
        type={type} 
        value={value || ""} 
        step={step} 
        placeholder={placeholder} 
        pattern={pattern}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
      />
    </label>
  );
}
