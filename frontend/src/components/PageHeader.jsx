export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37]">LB Mecânica</div>
        <h2 className="font-display text-3xl text-zinc-100" data-testid="page-header-title">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
