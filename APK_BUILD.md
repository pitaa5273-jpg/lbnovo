# LB Mecânica — APK Android

App Android nativo (via Capacitor) que reusa **100% do frontend React**.
Mesmo código, mesma UI, mesmas cores, mesmo backend
(`https://lbnovo.onrender.com`). Cada push para o GitHub gera um APK novo.

## Como baixar o APK depois do build

1. Abra seu repositório no GitHub
2. Clique em **Actions** (aba do topo)
3. Selecione o workflow **"Build Android APK"**
4. Clique no run mais recente (verde)
5. Role até a seção **Artifacts** no rodapé
6. Baixe `lb-mecanica-vX.X.X.apk` (zip)
7. Extraia → instale no celular Android

> ⚠️ É um **APK de debug**. Para instalar, ative em
> **Configurações → Segurança → Fontes desconhecidas**
> (ou autorize no momento da instalação).

## Login
- Usuário: `lbmecanica`
- Senha: `eaixuxu`

## Como funciona
- O Capacitor empacota o build do React (`frontend/build/`) dentro de
  uma WebView Android.
- O app sobe via `https://localhost` (interno) e chama a API do Render
  com `Bearer token`.
- Ícone e splash são gerados automaticamente a partir do logo "LB"
  laranja+dourado em `frontend/resources/`.

## Disparar build manualmente
Vá em **Actions → Build Android APK → Run workflow** e escolha o branch.

## Versionamento
Cada build incrementa `versionCode` automaticamente (igual ao número do
run do GitHub Actions) e gera versionName `1.0.<run>`.

## Para rodar localmente (opcional, requer Android Studio)
```bash
cd frontend
yarn install
yarn build
npx cap add android   # uma única vez
npx cap sync android
npx cap open android  # abre no Android Studio
```
