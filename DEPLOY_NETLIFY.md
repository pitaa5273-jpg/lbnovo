# LB Mecânica Automotiva — Deploy no Netlify

Painel React (CRA) — funciona 100% no front (com fallback localStorage caso a API esteja offline).

## ✅ Opção 1 — Conectar o repositório do GitHub (recomendado)

1. Acesse https://app.netlify.com → **Add new site → Import an existing project**.
2. Escolha **GitHub** e selecione o repositório que você acabou de subir.
3. Quando aparecer a tela de configurações de build, o `netlify.toml` (na raiz) já vai preencher automaticamente:
   - **Base directory**: `frontend`
   - **Build command**: `yarn build`
   - **Publish directory**: `frontend/build`
4. Clique em **Deploy site**. Em ~2 minutos seu painel está no ar.

> Não precisa configurar variáveis de ambiente. A URL da API
> (`https://lb-mecanica.onrender.com`) está em `src/services/api.js` e o app
> tem fallback automático para `localStorage` caso a API esteja fora.

## ✅ Opção 2 — Drag & drop manual

1. Localmente, dentro da pasta `frontend`:
   ```bash
   yarn install
   yarn build
   ```
2. Vá em https://app.netlify.com/drop e arraste a pasta `frontend/build` gerada.

## 🌐 Domínio personalizado

No painel do Netlify → **Domain settings → Add custom domain**.

## 🔁 Roteamento SPA

Já está resolvido pelo arquivo `frontend/public/_redirects`:
```
/*    /index.html   200
```
Isso garante que ao recarregar a página em `/clientes`, `/os` etc, o React Router recebe a rota corretamente.

## 🔐 Login

- **Usuário**: `lbmecanica`
- **Senha**: `eaixuxu`

Quando a API real (`lb-mecanica.onrender.com`) responder, o login passa a usar
`POST /login` automaticamente. Enquanto não responder, o frontend valida
localmente as credenciais acima e gera um token fake.
