# 🔔 Web Push Notifications — Teste

App de teste para notificações push usando [web-push](https://www.npmjs.com/package/web-push) + Node.js.

## Rodar localmente

```bash
npm install
node server.js
# Acesse: https://localhost:3000
```

## Deploy na Vercel

### 1. Suba o repositório no GitHub

```bash
git init
git add .
git commit -m "feat: web push notifications app"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

### 2. Importe o projeto na Vercel

- Acesse [vercel.com/new](https://vercel.com/new)
- Selecione o repositório
- Clique em **Deploy** (sem alterar nada)

### 3. Adicione o banco Redis (Upstash)

- No dashboard do projeto → **Integrations** → procure por **Upstash**
- Crie um banco Redis gratuito e conecte ao projeto
- As variáveis `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` serão adicionadas automaticamente

### 4. Configure as variáveis de ambiente VAPID

- No dashboard → **Settings** → **Environment Variables**
- Adicione as três variáveis abaixo:

| Variável | Valor |
|---|---|
| `VAPID_PUBLIC_KEY` | `BJ-zfdgN-Ix12eqFeyaEKd5oQzueBAR7j9hO-izxj9YfhF05U204_eck_j_ugWAHXk-TKDz0loHa1d8ARP7F0jY` |
| `VAPID_PRIVATE_KEY` | `SKWSPiD5xg-5G2P7btNEkTIgIXxF7Kxn_CbETXo5z5g` |
| `VAPID_MAILTO` | `mailto:teste@exemplo.com` |

### 5. Redeploy

- No dashboard → **Deployments** → clique nos 3 pontinhos do último deploy → **Redeploy**

---

## Estrutura do projeto

```
├── api/                    ← Funções serverless (Vercel)
│   ├── _utils.js           ← Redis + VAPID helpers compartilhados
│   ├── vapid-public-key.js
│   ├── subscribe.js
│   ├── unsubscribe.js
│   ├── send-notification.js
│   └── subscribers.js
├── public/                 ← Frontend estático
│   ├── index.html
│   └── sw.js               ← Service Worker
├── server.js               ← Servidor local (desenvolvimento)
├── vercel.json
└── .env.example
```
