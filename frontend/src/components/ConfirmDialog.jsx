import { AlertCircle } from "lucide-react";

export default function ConfirmDialog({ title, message, onConfirm, onCancel, isDangerous = false }) {
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div 
        className="lb-card p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isDangerous ? "text-red-400" : "text-[#ff6600]"}`} />
          <div>
            <h3 className="font-display text-lg text-zinc-100">{title}</h3>
            <p className="text-sm text-zinc-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button 
            onClick={onCancel}
            className="lb-btn-ghost"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className={`${isDangerous ? "bg-red-600 hover:bg-red-700 text-white border-red-600" : "lb-btn-primary"} px-4 py-2 rounded-lg font-medium transition-colors`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
