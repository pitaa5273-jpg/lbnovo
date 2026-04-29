import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCompany } from "../contexts/CompanyContext";
import { Wrench, Lock, User } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const { empresa } = useCompany();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!usuario || !senha) return toast.error("Informe usuário e senha");
    setLoading(true);
    try {
      await login(usuario.trim(), senha);
      toast.success("Acesso liberado");
      navigate("/dashboard");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        toast.error("Usuário ou senha incorretos");
      } else if (err?.code === "ECONNABORTED" || !err?.response) {
        toast.error("Servidor indisponível. Tente novamente em alguns segundos.");
      } else {
        toast.error(err?.message || "Falha no login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[420px] h-[420px] rounded-full bg-[#ff6600] opacity-[0.18] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-[#d4af37] opacity-[0.10] blur-[140px]" />
      </div>

      <div className="relative grid md:grid-cols-2 gap-0 w-full max-w-5xl rounded-2xl overflow-hidden border border-[#1f1f1f] bg-[#0e0e0e] shadow-[0_30px_120px_-40px_rgba(0,0,0,0.9)]">
        {/* Left visual panel */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-[#161616] via-[#0f0f0f] to-[#161616] relative">
          <div className="absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(45deg,#ff6600_0_2px,transparent_2px_14px)]" />
          <div className="relative">
            {empresa?.logo ? (
              <img src={empresa.logo} alt="logo" className="h-16 w-16 rounded-xl object-cover border border-[#262626]" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#ff6600] to-[#d4af37] flex items-center justify-center font-display text-2xl text-black">LB</div>
            )}
            <h1 className="font-display text-5xl mt-8 text-zinc-100 leading-none">
              LB MECÂNICA<br/><span className="text-[#ff6600]">AUTOMOTIVA</span>
            </h1>
            <p className="text-zinc-400 mt-4 max-w-sm text-sm">
              Painel de gestão profissional — controle completo de OS, orçamentos,
              clientes, peças, financeiro e relatórios em PDF.
            </p>
          </div>
          <div className="relative flex items-center gap-3 text-xs text-[#d4af37] uppercase tracking-[0.25em]">
            <Wrench className="h-4 w-4" /> Precisão • Confiança • Resultado
          </div>
        </div>

        {/* Right form panel */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]">Acesso restrito</div>
          <h2 className="font-display text-3xl mt-2 text-zinc-100">Entrar no painel</h2>
          <p className="text-sm text-zinc-400 mt-1">Use suas credenciais para acessar o sistema.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" data-testid="login-form">
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Usuário</label>
              <div className="relative mt-1">
                <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  data-testid="login-username"
                  className="lb-input pl-9"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="lbmecanica"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Senha</label>
              <div className="relative mt-1">
                <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  data-testid="login-password"
                  type="password"
                  className="lb-input pl-9"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="lb-btn-primary w-full mt-2 disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-8 text-[11px] text-zinc-500">
            Ao entrar você concorda com as políticas de uso interno do sistema.
          </div>
        </div>
      </div>
    </div>
  );
}
