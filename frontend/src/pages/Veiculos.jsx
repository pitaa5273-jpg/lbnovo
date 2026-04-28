import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { veiculosService, clientesService } from "../services/api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Modal, Inp } from "./Clientes";

export default function Veiculos() {
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setItems(await veiculosService.list() || []);
    setClientes(await clientesService.list() || []);
  };
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing({ marca: "", modelo: "", placa: "", ano: "", cor: "", km: "", clienteId: "" }); setOpen(true); };
  const startEdit = (v) => { setEditing({ ...v }); setOpen(true); };
  const save = async () => {
    if (!editing.placa || !editing.modelo) return toast.error("Placa e modelo são obrigatórios");
    const cli = clientes.find((c) => c.id === editing.clienteId);
    const data = { ...editing, clienteNome: cli?.nome || "" };
    if (editing.id) await veiculosService.update(editing.id, data);
    else await veiculosService.create(data);
    toast.success("Veículo salvo"); setOpen(false); load();
  };
  const remove = async (v) => {
    if (!window.confirm(`Excluir veículo ${v.placa}?`)) return;
    await veiculosService.remove(v.id); toast.success("Veículo removido"); load();
  };

  return (
    <div>
      <PageHeader
        title="Veículos"
        subtitle="Frota de clientes registrada na oficina."
        actions={<button data-testid="veiculo-new" className="lb-btn-primary" onClick={startNew}><Plus className="h-4 w-4 inline mr-2" />Novo Veículo</button>}
      />
      <div className="lb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="lb-table">
            <thead><tr><th>Placa</th><th>Marca</th><th>Modelo</th><th>Ano</th><th>Cliente</th><th>KM</th><th></th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-zinc-500">Nenhum veículo cadastrado.</td></tr>}
              {items.map((v) => (
                <tr key={v.id}>
                  <td className="font-mono text-[#d4af37]">{v.placa}</td>
                  <td>{v.marca}</td>
                  <td>{v.modelo}</td>
                  <td>{v.ano}</td>
                  <td>{v.clienteNome || "—"}</td>
                  <td>{v.km}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-[#ff6600]" onClick={() => startEdit(v)}><Pencil className="h-4 w-4" /></button>
                      <button className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-red-400" onClick={() => remove(v)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title={editing.id ? "Editar Veículo" : "Novo Veículo"} onClose={() => setOpen(false)}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Inp label="Placa *" testid="veiculo-form-placa" value={editing.placa} onChange={(v) => setEditing({ ...editing, placa: v.toUpperCase() })} />
            <Inp label="Marca" value={editing.marca} onChange={(v) => setEditing({ ...editing, marca: v })} />
            <Inp label="Modelo *" testid="veiculo-form-modelo" value={editing.modelo} onChange={(v) => setEditing({ ...editing, modelo: v })} />
            <Inp label="Ano" value={editing.ano} onChange={(v) => setEditing({ ...editing, ano: v })} />
            <Inp label="Cor" value={editing.cor} onChange={(v) => setEditing({ ...editing, cor: v })} />
            <Inp label="KM" value={editing.km} onChange={(v) => setEditing({ ...editing, km: v })} />
            <label className="block sm:col-span-2">
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Cliente</div>
              <select className="lb-input" value={editing.clienteId || ""} onChange={(e) => setEditing({ ...editing, clienteId: e.target.value })}>
                <option value="">— Selecione —</option>
                {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button className="lb-btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button data-testid="veiculo-form-save" className="lb-btn-primary" onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
