# LB Mecânica Automotiva — Backend (FastAPI + PostgreSQL + Cloudinary)

API REST que substitui o fallback localStorage do frontend deployado no Netlify.

## Stack
- **FastAPI** (Python 3.11+) com SQLAlchemy 2 async
- **PostgreSQL** com JSONB (cada recurso = doc JSONB indexável)
- **JWT HS256** (PyJWT) — login com credencial fixa via env
- **Cloudinary** (upload direto pelo backend, retorna URL CDN)
- CORS aberto (Bearer token, sem cookies)

## Endpoints
| Método | Rota | Descrição |
|---|---|---|
| POST | `/login` | `{ usuario, senha }` → `{ token, user }` |
| GET | `/` | health check |
| GET/POST/PUT/DELETE | `/clientes` | CRUD |
| GET/POST/PUT/DELETE | `/veiculos` | CRUD |
| GET/POST/PUT/DELETE | `/os` | CRUD ordens de serviço |
| GET/POST/PUT/DELETE | `/servicos` | CRUD catálogo |
| GET/POST/PUT/DELETE | `/pecas` | CRUD catálogo |
| GET/POST/PUT/DELETE | `/orcamentos` | CRUD |
| GET/POST/PUT/DELETE | `/financeiro` | CRUD lançamentos |
| GET/POST/PUT/DELETE | `/garantias` | CRUD |
| POST | `/upload` | `multipart: file, tipo` → `{ url }` |

Todos os endpoints (exceto `/login` e `/`) exigem header
`Authorization: Bearer {token}`.

## Modelagem
Cada recurso é uma tabela com 4 colunas:
- `id` (UUID, PK)
- `data` (JSONB) — payload completo do frontend
- `created_at` / `updated_at` (timestamps)

Vantagem: o frontend pode adicionar campos sem migrações no backend.

---

## 🚀 Deploy no Render — passo a passo

### Opção A — Blueprint (1 clique, recomendado)
1. Faça **push deste código** para o seu repositório no GitHub.
2. No Render, vá em **New → Blueprint** e selecione o repositório.
3. O `backend/render.yaml` já contém:
   - Web Service `lb-mecanica-api` (Python, free)
   - Banco PostgreSQL `lb-mecanica-db` (free, v16)
   - Variável `DATABASE_URL` injetada automaticamente
   - `JWT_SECRET` gerado automaticamente
   - `ADMIN_USER`, `ADMIN_PASS` já preenchidos
4. **Defina manualmente** as 3 variáveis do Cloudinary:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
5. Clique em **Apply**. Em ~3 min sua API estará no ar em
   `https://lb-mecanica-api.onrender.com` (ou o nome que você escolheu).

### Opção B — Manual
1. **Crie o banco** primeiro:
   - New → PostgreSQL → name `lb-mecanica-db`, plan free → Create.
   - Copie a **Internal Database URL** (formato `postgresql://...`).

2. **Crie o serviço web**:
   - New → Web Service → conecte o repo
   - Root Directory: `backend`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/`

3. **Variáveis de ambiente** (Settings → Environment):
   ```
   DATABASE_URL=postgresql+asyncpg://...   # ⚠️ troque "postgresql://" por "postgresql+asyncpg://"
   JWT_SECRET=<openssl rand -hex 32>
   JWT_EXPIRE_HOURS=24
   ADMIN_USER=lbmecanica
   ADMIN_PASS=eaixuxu
   FRONTEND_URL=*
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

4. **Deploy** — o serviço cria automaticamente todas as tabelas no primeiro boot.

> ⚠️ **Importante sobre o `DATABASE_URL`**: o Render entrega
> `postgresql://...`. Para o driver **asyncpg** funcionar, troque o
> prefixo para `postgresql+asyncpg://...`. Se preferir não editar,
> coloque o valor já com o prefixo correto.

---

## Frontend
O frontend (Netlify) já está configurado para chamar
`https://lb-mecanica.onrender.com`. Se o nome do seu serviço Render for
diferente, edite `frontend/src/services/api.js`:

```js
export const API_BASE = "https://SEU-SERVICO.onrender.com";
```

…e faça novo deploy no Netlify.

---

## Login
- **Usuário**: `lbmecanica`
- **Senha**: `eaixuxu`

Para trocar, ajuste `ADMIN_USER` e `ADMIN_PASS` no Render e faça redeploy.

---

## Teste local
```bash
cd backend
cp .env.example .env  # preencha com Postgres local + Cloudinary
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

Health: `curl http://localhost:8001/`
Login: `curl -X POST http://localhost:8001/login -H "Content-Type: application/json" -d '{"usuario":"lbmecanica","senha":"eaixuxu"}'`
