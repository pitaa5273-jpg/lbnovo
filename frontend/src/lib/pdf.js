import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { brl, fmtDate, fmtDateTime } from "./format";

const ORANGE = [255, 102, 0];
const GOLD = [212, 175, 55];
const DARK = [25, 25, 25];
const GRAY = [110, 110, 110];

function drawHeader(doc, empresa, title) {
  const pageW = doc.internal.pageSize.getWidth();

  // Top accent bar
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageW, 4, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 4, pageW, 1.2, "F");

  // Logo
  if (empresa?.logo && typeof empresa.logo === "string" && empresa.logo.startsWith("data:image")) {
    try { doc.addImage(empresa.logo, "PNG", 14, 12, 28, 28); } catch (_) { /* ignore */ }
  } else {
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.6);
    doc.roundedRect(14, 12, 28, 28, 3, 3);
    doc.setTextColor(...ORANGE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LB", 28, 30, { align: "center" });
  }

  // Company name & info
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(empresa?.nome || "LB Mecânica Automotiva", 48, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  const lines = [];
  if (empresa?.cnpj) lines.push(`CNPJ: ${empresa.cnpj}`);
  if (empresa?.telefone) lines.push(`Telefone: ${empresa.telefone}`);
  if (empresa?.endereco) lines.push(empresa.endereco);
  let y = 26;
  lines.forEach((l) => { doc.text(l, 48, y); y += 4.5; });

  // Title block
  doc.setDrawColor(220);
  doc.setLineWidth(0.2);
  doc.line(14, 46, pageW - 14, 46);

  doc.setTextColor(...ORANGE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 14, 54);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Emitido em: ${fmtDateTime(new Date())}`, pageW - 14, 54, { align: "right" });

  return 60;
}

function drawFooter(doc) {
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(14, pageH - 18, pageW - 14, pageH - 18);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("Documento gerado pelo sistema LB Mecânica Automotiva", pageW / 2, pageH - 12, { align: "center" });

  doc.setFontSize(7);
  doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageW - 14, pageH - 6, { align: "right" });
}

function clienteVeiculoBlock(doc, startY, cliente, veiculo) {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("CLIENTE", 14, startY);
  doc.text("VEÍCULO", 110, startY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.setFontSize(9);

  const cLines = [
    cliente?.nome || "—",
    cliente?.documento ? `CPF/CNPJ: ${cliente.documento}` : null,
    cliente?.telefone ? `Tel: ${cliente.telefone}` : null,
    cliente?.email || null,
  ].filter(Boolean);
  let y = startY + 5;
  cLines.forEach((l) => { doc.text(l, 14, y); y += 4.5; });

  const vLines = [
    veiculo ? `${veiculo.marca || ""} ${veiculo.modelo || ""}`.trim() : "—",
    veiculo?.placa ? `Placa: ${veiculo.placa}` : null,
    veiculo?.ano ? `Ano: ${veiculo.ano}` : null,
    veiculo?.km ? `KM: ${veiculo.km}` : null,
  ].filter(Boolean);
  let y2 = startY + 5;
  vLines.forEach((l) => { doc.text(l, 110, y2); y2 += 4.5; });

  return Math.max(y, y2) + 4;
}

function signatureBlock(doc) {
  const pageH = doc.internal.pageSize.getHeight();
  const y = pageH - 40;
  doc.setDrawColor(120);
  doc.setLineWidth(0.3);
  doc.line(20, y, 90, y);
  doc.line(115, y, 185, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("Assinatura do Cliente", 55, y + 5, { align: "center" });
  doc.text("LB Mecânica Automotiva", 150, y + 5, { align: "center" });
}

// ===== PUBLIC GENERATORS =====

export function gerarPDF_OS({ empresa, os, cliente, veiculo }) {
  const doc = new jsPDF();
  let y = drawHeader(doc, empresa, `ORDEM DE SERVIÇO #${os?.numero || os?.id || ""}`);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Status: ${os?.status || "Aberta"}    •    Abertura: ${fmtDate(os?.dataAbertura || os?.createdAt)}`, 14, y);
  y += 6;

  y = clienteVeiculoBlock(doc, y, cliente, veiculo);

  if (os?.descricao) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.setFontSize(10);
    doc.text("DESCRIÇÃO DO PROBLEMA / DIAGNÓSTICO", 14, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60);
    const split = doc.splitTextToSize(os.descricao, 180);
    doc.text(split, 14, y + 3);
    y += split.length * 4 + 6;
  }

  const servicos = os?.servicos || [];
  if (servicos.length) {
    autoTable(doc, {
      startY: y,
      head: [["Serviço", "Qtd", "Valor Unit.", "Subtotal"]],
      body: servicos.map((s) => [
        s.nome || s.descricao || "—",
        s.quantidade || 1,
        brl(s.valor),
        brl(Number(s.valor || 0) * Number(s.quantidade || 1)),
      ]),
      headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9 },
      theme: "striped",
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 4;
  }

  const pecas = os?.pecas || [];
  if (pecas.length) {
    autoTable(doc, {
      startY: y,
      head: [["Peça", "Qtd", "Valor Unit.", "Subtotal"]],
      body: pecas.map((p) => [
        p.nome || p.descricao || "—",
        p.quantidade || 1,
        brl(p.valor),
        brl(Number(p.valor || 0) * Number(p.quantidade || 1)),
      ]),
      headStyles: { fillColor: GOLD, textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9 },
      theme: "striped",
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 4;
  }

  // Total
  const totalServ = servicos.reduce((a, s) => a + Number(s.valor || 0) * Number(s.quantidade || 1), 0);
  const totalPec = pecas.reduce((a, p) => a + Number(p.valor || 0) * Number(p.quantidade || 1), 0);
  const total = Number(os?.valorTotal ?? totalServ + totalPec);

  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.5);
  doc.line(120, y + 2, 196, y + 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("TOTAL:", 130, y + 9);
  doc.setTextColor(...ORANGE);
  doc.text(brl(total), 196, y + 9, { align: "right" });

  signatureBlock(doc);
  drawFooter(doc);
  doc.save(`OS_${os?.numero || os?.id || "documento"}.pdf`);
}

export function gerarPDF_Orcamento({ empresa, orcamento, cliente, veiculo }) {
  const os = { ...orcamento, numero: orcamento?.numero, descricao: orcamento?.descricao, servicos: orcamento?.servicos, pecas: orcamento?.pecas, valorTotal: orcamento?.valorTotal };
  // Reuse shape but with title "ORÇAMENTO"
  const doc = new jsPDF();
  let y = drawHeader(doc, empresa, `ORÇAMENTO #${orcamento?.numero || orcamento?.id || ""}`);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Validade: ${orcamento?.validade ? fmtDate(orcamento.validade) : "—"}    •    Data: ${fmtDate(orcamento?.data || orcamento?.createdAt)}`, 14, y);
  y += 6;

  y = clienteVeiculoBlock(doc, y, cliente, veiculo);

  if (orcamento?.descricao) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.setFontSize(10);
    doc.text("DESCRIÇÃO", 14, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60);
    const split = doc.splitTextToSize(orcamento.descricao, 180);
    doc.text(split, 14, y + 3);
    y += split.length * 4 + 6;
  }

  const items = [
    ...(os.servicos || []).map((s) => ["Serviço", s.nome || s.descricao || "—", s.quantidade || 1, brl(s.valor), brl(Number(s.valor || 0) * Number(s.quantidade || 1))]),
    ...(os.pecas || []).map((p) => ["Peça", p.nome || p.descricao || "—", p.quantidade || 1, brl(p.valor), brl(Number(p.valor || 0) * Number(p.quantidade || 1))]),
  ];
  if (items.length) {
    autoTable(doc, {
      startY: y,
      head: [["Tipo", "Descrição", "Qtd", "Valor Unit.", "Subtotal"]],
      body: items,
      headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9 },
      theme: "striped",
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 4;
  }

  const total = Number(orcamento?.valorTotal || items.reduce((a, r) => a + Number(String(r[4]).replace(/[^\d,.-]/g, "").replace(",", ".")) || 0, 0));
  doc.setDrawColor(...ORANGE);
  doc.line(120, y + 2, 196, y + 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("TOTAL:", 130, y + 9);
  doc.setTextColor(...ORANGE);
  doc.text(brl(total), 196, y + 9, { align: "right" });

  signatureBlock(doc);
  drawFooter(doc);
  doc.save(`Orcamento_${orcamento?.numero || orcamento?.id || "documento"}.pdf`);
}

export function gerarPDF_Garantia({ empresa, garantia, os, cliente, veiculo }) {
  const doc = new jsPDF();
  let y = drawHeader(doc, empresa, `TERMO DE GARANTIA #${garantia?.numero || garantia?.id || ""}`);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`OS de origem: #${os?.numero || os?.id || "—"}    •    Prazo: ${garantia?.prazo || "—"} dias    •    Início: ${fmtDate(garantia?.inicio || garantia?.createdAt)}    •    Fim: ${fmtDate(garantia?.fim)}`, 14, y);
  y += 6;

  y = clienteVeiculoBlock(doc, y, cliente, veiculo);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.text("CONDIÇÕES DA GARANTIA", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60);
  const texto = garantia?.condicoes ||
    "A LB Mecânica Automotiva garante os serviços e peças aplicados conforme descrito na ordem de serviço, contra defeitos de execução, pelo prazo definido acima, contado a partir da data de saída do veículo. Ficam excluídos da garantia: (i) desgaste natural; (ii) mau uso ou negligência; (iii) intervenções de terceiros; (iv) acidentes; (v) componentes não substituídos por nossa oficina.";
  const wrapped = doc.splitTextToSize(texto, 180);
  doc.text(wrapped, 14, y + 4);
  y += wrapped.length * 4 + 8;

  if (garantia?.itens?.length) {
    autoTable(doc, {
      startY: y,
      head: [["Item Coberto", "Observação"]],
      body: garantia.itens.map((i) => [i.descricao || i.nome || "—", i.observacao || "—"]),
      headStyles: { fillColor: GOLD, textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9 },
      theme: "striped",
      margin: { left: 14, right: 14 },
    });
  }

  signatureBlock(doc);
  drawFooter(doc);
  doc.save(`Garantia_${garantia?.numero || garantia?.id || "documento"}.pdf`);
}

export function gerarPDF_Fechamento({ empresa, periodo, lancamentos, totais }) {
  const doc = new jsPDF();
  let y = drawHeader(doc, empresa, `FECHAMENTO DE CAIXA — ${periodo?.label || ""}`);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`De ${fmtDate(periodo?.inicio)} até ${fmtDate(periodo?.fim)}`, 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Data", "Tipo", "Descrição", "Categoria", "Valor"]],
    body: (lancamentos || []).map((l) => [
      fmtDate(l.data || l.createdAt),
      (l.tipo || "").toUpperCase(),
      l.descricao || "—",
      l.categoria || "—",
      brl(l.valor),
    ]),
    headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9 },
    theme: "striped",
    margin: { left: 14, right: 14 },
  });
  let y2 = doc.lastAutoTable.finalY + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(`Entradas: ${brl(totais?.entradas || 0)}`, 14, y2);
  doc.text(`Saídas: ${brl(totais?.saidas || 0)}`, 80, y2);
  doc.setTextColor(...ORANGE);
  doc.text(`Saldo: ${brl(totais?.saldo || 0)}`, 150, y2);

  drawFooter(doc);
  doc.save(`Fechamento_${periodo?.label || "caixa"}.pdf`);
}

export function gerarPDF_Relatorio({ empresa, titulo, colunas, linhas, totais }) {
  const doc = new jsPDF();
  let y = drawHeader(doc, empresa, titulo || "RELATÓRIO");

  autoTable(doc, {
    startY: y,
    head: [colunas],
    body: linhas,
    headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9 },
    theme: "striped",
    margin: { left: 14, right: 14 },
  });

  let y2 = doc.lastAutoTable.finalY + 6;
  if (totais && totais.length) {
    totais.forEach((t, i) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(i === totais.length - 1 ? ORANGE[0] : DARK[0], i === totais.length - 1 ? ORANGE[1] : DARK[1], i === totais.length - 1 ? ORANGE[2] : DARK[2]);
      doc.text(`${t.label}: ${typeof t.value === "number" ? brl(t.value) : t.value}`, 14 + i * 60, y2);
    });
  }
  drawFooter(doc);
  doc.save(`${titulo || "relatorio"}.pdf`);
}
