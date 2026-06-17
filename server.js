// ─────────────────────────────────────────────────────────────────────────────
// server.js — Servidor LOCAL para desenvolvimento
// Para produção (Vercel), as rotas ficam em /api/*.js
// ─────────────────────────────────────────────────────────────────────────────
require('dotenv').config(); // carrega o .env local

const express = require('express');
const https   = require('https');
const http    = require('http');
const webpush = require('web-push');
const cors    = require('cors');
const path    = require('path');
const os      = require('os');
const selfsigned = require('selfsigned');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── VAPID Keys ───────────────────────────────────────────────────────────────
// Em desenvolvimento, carrega do .env. Em produção (Vercel), são env vars da plataforma.
let vapidPublicKey  = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidMailto   = process.env.VAPID_MAILTO || 'mailto:teste@exemplo.com';

if (!vapidPublicKey || !vapidPrivateKey) {
  // Fallback: gera chaves temporárias se não houver .env (apenas dev)
  console.log('⚠️  .env não encontrado — gerando chaves VAPID temporárias (apenas para teste local)');
  console.log('   Para persistência, copie .env.example para .env e preencha as chaves.');
  const keys  = webpush.generateVAPIDKeys();
  vapidPublicKey  = keys.publicKey;
  vapidPrivateKey = keys.privateKey;
  console.log('\n📋 Chaves temporárias geradas:');
  console.log('   VAPID_PUBLIC_KEY=' + vapidPublicKey);
  console.log('   VAPID_PRIVATE_KEY=' + vapidPrivateKey);
  console.log('');
} else {
  console.log('✅ Chaves VAPID carregadas do .env');
}

webpush.setVapidDetails(vapidMailto, vapidPublicKey, vapidPrivateKey);

// ─── Armazenamento em memória (apenas local) ──────────────────────────────────
const subscriptions = new Map();

// ─── Rotas da API ─────────────────────────────────────────────────────────────

app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidPublicKey });
});

app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Subscription inválida' });
  }
  const id = Buffer.from(subscription.endpoint).toString('base64').slice(-24);
  subscriptions.set(id, subscription);
  console.log(`✅ Subscriber registrado [id: ${id}] | Total: ${subscriptions.size}`);
  res.status(201).json({ success: true, id });
});

app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: 'endpoint é obrigatório' });
  const id = Buffer.from(endpoint).toString('base64').slice(-24);
  subscriptions.delete(id);
  console.log(`🗑️  Subscription removida [id: ${id}]`);
  res.json({ success: true });
});

app.post('/api/send-notification', async (req, res) => {
  if (subscriptions.size === 0) {
    return res.status(400).json({ error: 'Nenhum subscriber registrado.' });
  }

  const {
    title = '🔔 Notificação de Teste',
    body  = 'Esta notificação foi enviada pelo servidor Node.js local!',
    icon  = '/icon.png',
    badge = '/badge.png',
    url   = '/',
    tag   = 'test-notification',
  } = req.body;

  const payload  = JSON.stringify({ title, body, icon, badge, url, tag });
  const results  = { success: 0, failed: 0, errors: [] };
  const toDelete = [];

  await Promise.all([...subscriptions.entries()].map(async ([id, sub]) => {
    try {
      await webpush.sendNotification(sub, payload);
      results.success++;
      console.log(`📤 Enviada para [id: ${id}]`);
    } catch (err) {
      results.failed++;
      if (err.statusCode === 410 || err.statusCode === 404) toDelete.push(id);
      results.errors.push({ id, message: err.message });
    }
  }));

  toDelete.forEach(id => subscriptions.delete(id));
  console.log(`\n📊 Resultado: ${results.success} enviadas, ${results.failed} falhas\n`);

  res.json({
    success: true,
    stats: { total: subscriptions.size, sent: results.success, failed: results.failed },
    errors: results.errors,
  });
});

app.get('/api/subscribers', (req, res) => {
  res.json({ count: subscriptions.size, subscribers: [...subscriptions.keys()].map(id => ({ id })) });
});

// ─── Detecta IPs da rede local ────────────────────────────────────────────────
function getLocalIPs() {
  const ifaces = os.networkInterfaces();
  return Object.values(ifaces)
    .flat()
    .filter(i => i.family === 'IPv4' && !i.internal)
    .map(i => i.address);
}

// ─── Start ────────────────────────────────────────────────────────────────────
const localIPs = getLocalIPs();

// HTTPS (rede local)
const pems = selfsigned.generate([{ name: 'commonName', value: 'localhost' }], {
  days: 365,
  extensions: [{
    name: 'subjectAltName',
    altNames: [
      { type: 2, value: 'localhost' },
      ...localIPs.map(ip => ({ type: 7, ip })),
    ],
  }],
});

https.createServer({ key: pems.private, cert: pems.cert }, app).listen(PORT, '0.0.0.0', () => {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   🔔 Web Push — Servidor de Desenvolvimento   ║');
  console.log('╚═══════════════════════════════════════════════╝\n');
  console.log(`✅ Local:        https://localhost:${PORT}`);
  if (localIPs.length > 0) {
    console.log('\n📱 Rede local:');
    localIPs.forEach(ip => console.log(`   https://${ip}:${PORT}`));
  }
  console.log('\n⚠️  Aceite o aviso de certificado no navegador (Avançado → Continuar).\n');
});

// HTTP adicional (localhost)
http.createServer(app).listen(Number(PORT) + 1, 'localhost', () => {
  console.log(`ℹ️  HTTP apenas localhost: http://localhost:${Number(PORT) + 1}\n`);
});
