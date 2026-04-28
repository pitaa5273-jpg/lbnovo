import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { garantiasService, osService, clientesService, veiculosService } from "../services/api";
import { FileDown, Trash2 } from "lucide-react";
import { brl, fmtDate } from "../lib/format";
import { gerarPDF_Garantia } from "../lib/pdf";
import { useCompany } from "../contexts/CompanyContext";
import { toast } from "sonner";

export default function Garantias() {
  const { empresa } = useCompany();
  const [items, setItems] = useState([]);
  const [oss, setOss] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);

  const load = async () => {
    const [g, o, c, v] = await Promise.all([
      garantiasService.list(), osService.list(),
      clientesService.list(), veiculosService.list(),
    ]);
    setItems(Array.isArray(g) ? g : []);
    setOss(Array.isArray(o) ? o : []);
    setClientes(Array.isArray(c) ? c : []);
    setVeiculos(Array.isArray(v) ? v : []);
  };
  useEffect(() => { load(); }, []);

  const exportPDF = (g) => {
    const os = oss.find((o) => o.id === g.osId);
    const cliente = clientes.find((c) => c.id === g.clienteId);
    const veiculo = veiculos.find((v) => v.id === g.veiculoId);
    gerarPDF_Garantia({ empresa, garantia: g, os, cliente, veiculo });
  };
  const remove = async (g) => {
    if (!window.confirm(`Excluir garantia ${g.numero}?`)) return;
    await garantiasService.remove(g.id); toast.success("Removida"); load();
  };

  return (
    <div>
      <PageHeader title="Garantias" subtitle="Termos de garantia gerados a partir das OS finalizadas." />
      <div className="lb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="lb-table">
            <thead><tr><th>Nº</th><th>OS</th><th>Cliente</th><th>Veículo</th><th>Início</th><th>Fim</th><th>Prazo</th><th></th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-zinc-500">Nenhuma garantia gerada. Use o botão de garantia em uma OS.</td></tr>}
              {items.map((g) => {
                const ativo = g.fim && new Date(g.fim) > new Date();
                return (
                  <tr key={g.id}>
                    <td className="font-mono text-[#d4af37]">{g.numero}</td>
                    <td>#{g.osNumero || "—"}</td>
                    <td>{g.clienteNome}</td>
                    <td>{g.veiculoLabel}</td>
                    <td>{fmtDate(g.inicio)}</td>
                    <td>{fmtDate(g.fim)}</td>
                    <td><span className={`lb-badge ${ativo ? "lb-badge-green" : "lb-badge-gray"}`}>{ativo ? "Ativa" : "Expirada"} • {g.prazo}d</span></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-[#d4af37]" onClick={() => exportPDF(g)}><FileDown className="h-4 w-4" /></button>
                        <button className="p-2 rounded hover:bg-[#1a1a1a] text-zinc-300 hover:text-red-400" onClick={() => remove(g)}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
