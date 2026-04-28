export const brl = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString("pt-BR");
};

export const fmtDateTime = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleString("pt-BR");
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const sumValores = (arr, field = "valor") =>
  (arr || []).reduce((acc, it) => acc + Number(it?.[field] || 0), 0);
