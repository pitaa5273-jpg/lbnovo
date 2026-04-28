import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { useCompany } from "../contexts/CompanyContext";
import { fileToDataURL } from "../services/api";
import { Building2, Image as ImgIcon, Save } from "lucide-react";
import { toast } from "sonner";

export default function Empresa() {
  const { empresa, update } = useCompany();
  const [form, setForm] = useState(empresa);

  const onLogo = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const data = await fileToDataURL(f);
    setForm({ ...form, logo: data });
  };

  const save = () => {
    update(form);
    toast.success("Dados da empresa salvos com sucesso");
  };

  return (
    <div>
      <PageHeader
        title="Empresa"
        subtitle="Configure os dados que aparecerão em todos os PDFs e no painel."
        actions={
          <button data-testid="empresa-save" className="lb-btn-primary" onClick={save}>
            <Save className="h-4 w-4 inline mr-2" />Salvar
          </button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lb-card p-6 lg:col-span-2 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome da Empresa">
              <input data-testid="empresa-nome" className="lb-input" value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </Field>
            <Field label="CNPJ">
              <input data-testid="empresa-cnpj" className="lb-input" value={form.cnpj || ""} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
            </Field>
            <Field label="Telefone">
              <input data-testid="empresa-telefone" className="lb-input" value={form.telefone || ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="E-mail">
              <input className="lb-input" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com" />
            </Field>
            <Field label="Endereço Completo" className="sm:col-span-2">
              <textarea data-testid="empresa-endereco" rows={3} className="lb-input" value={form.endereco || ""} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número, bairro, cidade — UF" />
            </Field>
          </div>
        </div>

        <div className="lb-card p-6">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">Identidade Visual</div>
          <h3 className="font-display text-xl text-zinc-100">Logo</h3>

          <div className="mt-5 flex flex-col items-center justify-center gap-4">
            <div className="h-36 w-36 rounded-xl border border-dashed border-[#2c2c2c] bg-[#0c0c0c] flex items-center justify-center overflow-hidden">
              {form.logo ? (
                <img src={form.logo} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <div className="text-zinc-500 flex flex-col items-center text-xs">
                  <ImgIcon className="h-6 w-6 mb-2" />Sem logo
                </div>
              )}
            </div>

            <label className="lb-btn-ghost cursor-pointer text-sm">
              <input data-testid="empresa-logo-input" type="file" accept="image/*" className="hidden" onChange={onLogo} />
              Selecionar imagem
            </label>
            {form.logo && (
              <button className="text-xs text-zinc-400 hover:text-[#ff6600]" onClick={() => setForm({ ...form, logo: "" })}>
                Remover logo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 lb-card p-6">
        <div className="flex items-center gap-2 text-[#d4af37] text-sm">
          <Building2 className="h-4 w-4" /> Pré-visualização do cabeçalho dos PDFs
        </div>
        <div className="mt-4 p-5 rounded-xl bg-white text-black">
          <div className="flex items-start gap-4">
            {form.logo ? (
              <img src={form.logo} alt="logo" className="h-16 w-16 object-cover rounded" />
            ) : (
              <div className="h-16 w-16 rounded border border-[#ff6600] flex items-center justify-center text-[#ff6600] font-bold">LB</div>
            )}
            <div>
              <div className="font-bold text-lg">{form.nome || "LB Mecânica Automotiva"}</div>
              <div className="text-xs text-zinc-600">{form.cnpj && <>CNPJ: {form.cnpj}<br /></>}{form.telefone && <>Telefone: {form.telefone}<br /></>}{form.endereco}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">{label}</div>
      {children}
    </label>
  );
}
