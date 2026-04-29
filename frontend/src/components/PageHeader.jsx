export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
      <div>
        {subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
