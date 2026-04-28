import { useRef } from "react";
import PageHeader from "../components/PageHeader";
import {
  clientesService, veiculosService, osService, servicosService,
  pecasService, orcamentosService, financeiroService, garantiasService,
} from "../services/api";
import { localDB, getEmpresa, setEmpresa } from "../services/localDB";
import { Download, Upload, Database } from "lucide-react";
import { toast } from "sonner";

const RESOURCES = [
  { key: "clientes", svc: clientesService },
  { key: "veiculos", svc: veiculosService },
  { key: "os", svc: osService },
  { key: "servicos", svc: servicosService },
  { key: "pecas", svc: pecasService },
  { key: "orcamentos", svc: orcamentosService },
  { key: "financeiro", svc: financeiroService },
  { key: "garantias", svc: garantiasService },
];

export default function Backup() {
  const fileRef = useRef();

  const exportar = async () => {
    const out = { exportedAt: new Date().toISOString(), empresa: getEmpresa(), data: {} };
    for (const r of RESOURCES) {
      try { out.data[r.key] = (await r.svc.list()) || []; }
      catch { out.data[r.key] = []; }
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lb-mecanica-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success("Backup gerado e baixado");
  };

  const importar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!window.confirm("Substituir os dados atuais pelos dados do arquivo?")) { e.target.value = ""; return; }
    try {
      const txt = await file.text();
      const json = JSON.parse(txt);
      if (json.empresa) setEmpresa(json.empresa);
      for (const r of RESOURCES) {
        const arr = json.data?.[r.key];
        if (Array.isArray(arr)) {
          localDB(r.key).replaceAll(arr);
          // attempt to push to API as well
          for (const item of arr) {
            try { await r.svc.create(item); } catch { /* ignore */ }
          }
        }
      }
      toast.success("Backup restaurado com sucesso");
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast.error("Falha ao importar: arquivo inválido");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div>
      <PageHeader title="Backup e Restauração" subtitle="Exporte todos os dados em JSON ou restaure um backup." />
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="lb-card p-6">
          <Database className="h-6 w-6 text-[#ff6600]" />
          <h3 className="font-display text-2xl mt-3 text-zinc-100">Exportar tudo</h3>
          <p className="text-sm text-zinc-400 mt-1">Gera um arquivo JSON com clientes, veículos, OS, serviços, peças, orçamentos, garantias, financeiro e empresa.</p>
          <button data-testid="backup-export" className="lb-btn-primary mt-4" onClick={exportar}>
            <Download className="h-4 w-4 inline mr-2" />Baixar backup JSON
          </button>
        </div>

        <div className="lb-card p-6">
          <Database className="h-6 w-6 text-[#d4af37]" />
          <h3 className="font-display text-2xl mt-3 text-zinc-100">Importar backup</h3>
          <p className="text-sm text-zinc-400 mt-1">Substitui os dados atuais pelos dados do arquivo JSON. Faça um backup antes.</p>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importar} data-testid="backup-import-input" />
          <button data-testid="backup-import" className="lb-btn-ghost mt-4" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 inline mr-2" />Selecionar arquivo
          </button>
        </div>
      </div>
    </div>
  );
}
