import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { servicosService, pecasService } from "../services/api";
import { Modal, Inp } from "./Clientes";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { brl } from "../lib/format";

function CrudCatalogo({ titulo, subtitulo, service, testidPrefix }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => service.list().then((d) => setItems(Array.isArray(d) ? d : []));
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing({ nome: "", descricao: "", valor: 0 }); setOpen(true); };
  const startEdit = (it) => { setEditing({ ...it }); setOpen(true); };
  const save = async () => {
    if (!editing.nome) return toast.error("Nome obrigatório");
    const data = { ...editing, valor: Number(editing.valor || 0) };
    if (editing.id) await service.update(editing.id, data); else await service.create(data);
    toast.success("Salvo"); setOpen(false); load();
  };
  const remove = async (it) => {
    if (!window.confirm(`Excluir "${it.nome}"?`)) return;
    await service.remove(it.id); toast.success("Removido"); load();
  };

  return (
    <div>
      <PageHeader title={titulo} subtitle={subtitulo}
        actions={<button data-testid={`${testidPrefix}-new`} className="lb-btn-primary" onClick={startNew}><Plus className="h-4 w-4 inline mr-2" />Novo</button>}
      />
      <div className="lb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="lb-table">
            <thead><tr><th>Nome</th><th>Descrição</th><th>Valor Padrão</th><th></th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-zinc-500">Nada cadastrado.</td></tr>}
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="font-medium">{it.nome}</td>
                  <td className="text-zinc-400">{it.descricao || "—"}</td>
                  <td className="font-mono text-[#d4af37]">{brl(it.valor)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-[#ff6600]" onClick={() => startEdit(it)}><Pencil className="h-4 w-4" /></button>
                      <button className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-red-400" onClick={() => remove(it)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {open && (
        <Modal title={editing.id ? `Editar` : `Novo`} onClose={() => setOpen(false)}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Inp label="Nome *" testid={`${testidPrefix}-form-nome`} value={editing.nome} onChange={(v) => setEditing({ ...editing, nome: v })} />
            <Inp label="Valor (R$)" type="number" testid={`${testidPrefix}-form-valor`} value={editing.valor} onChange={(v) => setEditing({ ...editing, valor: v })} step="0.01" />
            <Inp label="Descrição" className="sm:col-span-2" value={editing.descricao} onChange={(v) => setEditing({ ...editing, descricao: v })} />
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button className="lb-btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button data-testid={`${testidPrefix}-form-save`} className="lb-btn-primary" onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Servicos() {
  return <CrudCatalogo titulo="Catálogo de Serviços" subtitulo="Itens de mão de obra utilizados nas OS." service={servicosService} testidPrefix="servico" />;
}
export function Pecas() {
  return <CrudCatalogo titulo="Catálogo de Peças" subtitulo="Peças utilizadas em ordens de serviço." service={pecasService} testidPrefix="peca" />;
}
