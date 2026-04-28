# LB Mecânica Automotiva — Product Requirements

## Original Problem Statement
Painel web profissional "LB Mecânica Automotiva" integrado com a API
`https://lb-mecanica.onrender.com`. Tema escuro premium (preto #0f0f0f,
laranja #ff6600, dourado #d4af37). Login fixo `lbmecanica/eaixuxu`.
Módulos: Dashboard, Empresa, Clientes, Veículos, OS, Orçamentos, Serviços,
Peças, Garantias, Financeiro, Fechamento de Caixa, Backup. PDFs profissionais
com cabeçalho da empresa. Upload de fotos de OS (chegada / manutenção / saída).
Backup JSON export/import.

## Architecture
- **Frontend-only React SPA** (CRA + Tailwind + shadcn/ui).
- API layer (`src/services/api.js`) com Axios → fallback automático a
  localStorage (`src/services/localDB.js`) sempre que a API real estiver
  fora do ar (atualmente retorna 404).
- Auth: tenta `POST /login` na API; se falhar, valida credenciais fixas
  e gera token fake. Token salvo em localStorage e enviado como
  `Authorization: Bearer …`.
- Empresa: dados + logo (base64) salvos em `localStorage.lb_empresa`.
- PDFs gerados via `jspdf` + `jspdf-autotable` (`src/lib/pdf.js`).

## User Personas
- **Mecânico / proprietário**: cadastra clientes, veículos, OS, peças,
  acompanha caixa, gera orçamentos e PDFs.
- **Atendente**: registra entradas / saídas no financeiro, imprime
  garantias e fechamentos.

## Core Requirements (static)
1. Login com fallback local (`lbmecanica/eaixuxu`).
2. Dashboard com OS abertas/andamento/finalizadas + faturamento.
3. CRUD: Clientes, Veículos, Serviços, Peças, OS, Orçamentos, Garantias,
   Financeiro.
4. OS com serviços, peças, total automático, fotos por tipo, finalização
   que cria automaticamente lançamento de entrada no financeiro.
5. Orçamento → conversão em OS.
6. Garantia gerada a partir de uma OS com prazo configurável.
7. Fechamento de caixa diário/semanal/mensal.
8. Backup JSON (export e import com substituição).
9. PDFs com cabeçalho premium (logo + dados da empresa).

## Implemented (2026-04-28)
- Tema dark premium completo, fonte Bebas Neue + Outfit.
- Layout com sidebar lateral + topbar + responsivo.
- Login (página dupla com painel visual).
- Dashboard com 8 stat cards + tabela últimas OS + resumo financeiro.
- Empresa: form completo + upload logo (base64) + preview do cabeçalho.
- Clientes: CRUD + busca.
- Veículos: CRUD vinculado a cliente.
- Serviços e Peças: catálogos.
- OS: CRUD com line items, totais auto, upload de fotos
  (chegada/manutencao/saida), finalização → lançamento financeiro.
- Orçamentos: CRUD + conversão em OS.
- Garantias: listagem + PDF + status (ativa/expirada).
- Financeiro: entradas / saídas / saldo + relatório PDF.
- Fechamento: tabs diário/semanal/mensal + PDF.
- Backup: export e import JSON.
- PDF: OS, Orçamento, Garantia, Fechamento, Relatório.

## Tested
- Testing agent v3 — 11/12 fluxos PASS, 1 WARN (Veículos test script
  filling). No critical issues.

## Backlog
- **P1** — Conferir form Veículos com teste manual de edge cases.
- **P1** — Substituir `<select>` nativos por shadcn Select para
  filtros mais ricos.
- **P2** — Sincronização incremental quando a API real voltar online.
- **P2** — Filtros de período no Dashboard (mês/ano).
- **P2** — Gráfico (Recharts) de faturamento mensal.
- **P3** — Notificações de garantia próxima do vencimento.
- **P3** — Integração com WhatsApp para envio de orçamento.
