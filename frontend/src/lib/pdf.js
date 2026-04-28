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
  const pageW = doc.internal.pageSize.getWidth();
  let y = drawHeader(doc, empresa, `TERMO DE GARANTIA #${garantia?.numero || garantia?.id || ""}`);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(
    `OS de origem: #${os?.numero || garantia?.osNumero || "—"}    •    Início: ${fmtDate(garantia?.inicio || garantia?.createdAt)}    •    Fim: ${fmtDate(garantia?.fim)}`,
    14, y
  );
  y += 7;

  const sectionTitle = (text) => {
    doc.setFillColor(...ORANGE);
    doc.rect(14, y - 4, 3, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(text, 20, y);
    y += 6;
  };
  const para = (text, indent = 14, opts = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size || 9);
    doc.setTextColor(opts.color || 60);
    const w = pageW - 28 - (indent - 14);
    const lines = doc.splitTextToSize(text, w);
    if (y + lines.length * 4 > 275) { doc.addPage(); y = 20; }
    doc.text(lines, indent, y);
    y += lines.length * 4 + (opts.gap ?? 1);
  };
  const kv = (label, value, x = 14, w = 60) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(label, x, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    const v = String(value || "—");
    const lines = doc.splitTextToSize(v, w);
    doc.text(lines, x + 22, y);
    return lines.length * 4;
  };

  // ===== DADOS DO CLIENTE =====
  sectionTitle("DADOS DO CLIENTE");
  const startY = y;
  const h1 = kv("Nome:", cliente?.nome, 14, 75);
  const h2 = kv("Telefone:", cliente?.telefone, 110, 75);
  y = startY + Math.max(h1, h2) + 1;
  const sy2 = y;
  const h3 = kv("CPF/CNPJ:", cliente?.documento, 14, 75);
  const h4 = kv("E-mail:", cliente?.email, 110, 75);
  y = sy2 + Math.max(h3, h4) + 4;

  // ===== DADOS DO VEÍCULO =====
  sectionTitle("DADOS DO VEÍCULO");
  const sy3 = y;
  const v1 = kv("Placa:", veiculo?.placa, 14, 75);
  const v2 = kv("Marca/Modelo:", `${veiculo?.marca || ""} ${veiculo?.modelo || ""}`.trim(), 110, 75);
  y = sy3 + Math.max(v1, v2) + 1;
  const sy4 = y;
  const v3 = kv("Ano:", veiculo?.ano, 14, 30);
  const v4 = kv("KM:", veiculo?.km, 60, 30);
  const v5 = kv("Combustível:", veiculo?.combustivel, 110, 50);
  y = sy4 + Math.max(v3, v4, v5) + 5;

  // ===== PERÍODO DE GARANTIA =====
  sectionTitle("PERÍODO DE GARANTIA");
  const prazo = garantia?.prazo || 90;
  const prazoExt = numeroPorExtenso(prazo);
  para(
    `A garantia dos serviços executados é de ${prazo} (${prazoExt}) dias, contados a partir da data de entrega do veículo, nos termos do art. 26 do Código de Defesa do Consumidor.`,
    14, { gap: 3 }
  );
  y += 2;

  // ===== SERVIÇOS EXECUTADOS =====
  sectionTitle("SERVIÇOS EXECUTADOS");
  const servicos = (garantia?.servicos || os?.servicos || []);
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
  } else if (garantia?.descricao || os?.descricao) {
    para(garantia?.descricao || os?.descricao, 14, { gap: 3 });
  } else {
    para("—", 14);
  }

  // ===== PEÇAS SUBSTITUÍDAS / APLICADAS =====
  sectionTitle("PEÇAS SUBSTITUÍDAS / APLICADAS");
  const pecas = (garantia?.pecas || os?.pecas || []);
  if (pecas.length) {
    autoTable(doc, {
      startY: y,
      head: [["Peça / Especificação", "Qtd", "Valor Unit.", "Subtotal"]],
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
  } else {
    para("—", 14);
  }

  // ===== CONDIÇÕES DA GARANTIA =====
  sectionTitle("CONDIÇÕES DE GARANTIA");
  const cond = [
    "1. A garantia cobre exclusivamente os serviços executados e as peças efetivamente descritas neste termo.",
    "2. A garantia compreende a correção de eventuais vícios de serviço ou defeitos de instalação, desde que constatado nexo entre o serviço realizado e o problema apresentado.",
    "3. A garantia não cobre:",
    "    • desgaste natural decorrente do uso regular do veículo;",
    "    • danos causados por mau uso, negligência ou utilização em condições inadequadas;",
    "    • acidentes, colisões, alagamentos ou eventos de força maior;",
    "    • problemas decorrentes de manutenção inadequada ou não realização de revisões recomendadas pelo fabricante.",
    "4. A realização de reparos ou intervenções por terceiros não autorizados poderá acarretar a perda da garantia, desde que haja relação com o defeito apresentado.",
    "5. Em caso de eventual problema, o cliente deverá encaminhar o veículo à oficina para análise técnica prévia, sendo vedada a execução de reparos sem autorização da empresa.",
    "6. Constatado que o defeito decorre dos serviços prestados, a empresa realizará o reparo sem custo adicional ao cliente, dentro de prazo razoável.",
    "7. Custos de deslocamento ou transporte do veículo até a oficina serão de responsabilidade do cliente, salvo acordo expresso em contrário ou quando comprovada a responsabilidade exclusiva da empresa.",
  ];
  cond.forEach((c) => para(c, 14, { gap: 0 }));
  y += 2;

  // ===== CIÊNCIA DO CLIENTE =====
  if (y > 230) { doc.addPage(); y = 20; }
  sectionTitle("CIÊNCIA DO CLIENTE");
  para("O cliente declara que:", 14, { gap: 1 });
  [
    "• foi devidamente informado sobre os serviços realizados;",
    "• recebeu orientações básicas de uso e manutenção;",
    "• está ciente das condições de garantia acima descritas;",
    "• recebeu o veículo após a execução dos serviços, ciente de suas condições aparentes de funcionamento.",
  ].forEach((c) => para(c, 18, { gap: 0 }));
  y += 3;

  // ===== VALOR DOS SERVIÇOS =====
  sectionTitle("VALOR DOS SERVIÇOS");
  const total = Number(garantia?.valorTotal ?? os?.valorTotal ?? 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("Valor total:", 14, y);
  doc.setTextColor(...ORANGE);
  doc.text(brl(total), 42, y);
  y += 7;

  // Local e data
  const cidade = (empresa?.endereco || "").split(",").slice(-2, -1)[0]?.trim() || empresa?.cidade || "_______________";
  const dataStr = fmtDate(garantia?.inicio || new Date());
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(`Local e Data: ${cidade}, ${dataStr}`, 14, y);
  y += 12;

  // ===== ASSINATURAS =====
  if (y > 250) { doc.addPage(); y = 30; }
  doc.setDrawColor(120);
  doc.setLineWidth(0.3);
  doc.line(20, y + 8, 90, y + 8);
  doc.line(115, y + 8, 185, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("Assinatura do Cliente", 55, y + 13, { align: "center" });
  doc.text(empresa?.nome || "Assinatura da Empresa", 150, y + 13, { align: "center" });

  drawFooter(doc);
  doc.save(`Garantia_${garantia?.numero || garantia?.id || "documento"}.pdf`);
}

// utilitário simples para extenso de inteiro pequeno (1-365 cobrindo prazos típicos)
function numeroPorExtenso(n) {
  const u = ["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","catorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
  const d = ["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
  const c = ["","cento","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];
  if (n == null || isNaN(n)) return "";
  n = Math.floor(Number(n));
  if (n < 20) return u[n];
  if (n < 100) {
    const dz = Math.floor(n / 10), un = n % 10;
    return un === 0 ? d[dz] : `${d[dz]} e ${u[un]}`;
  }
  if (n === 100) return "cem";
  if (n < 1000) {
    const ce = Math.floor(n / 100), rest = n % 100;
    const ceText = ce === 1 ? "cento" : c[ce];
    return rest === 0 ? ceText : `${ceText} e ${numeroPorExtenso(rest)}`;
  }
  return String(n);
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
