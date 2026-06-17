// ── Utilitário compartilhado: cliente Redis e VAPID ──────────────────────────
const { Redis } = require('@upstash/redis');
const webpush   = require('web-push');

// ─── Redis ────────────────────────────────────────────────────────────────────
function getRedis() {
  // Aceita tanto o prefixo UPSTASH_ (legado) quanto KV_ (novo padrão da Vercel/Upstash)
  const url   = process.env.UPSTASH_REDIS_REST_URL  || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Variáveis Redis não configuradas. ' +
      'Conecte o banco Upstash ao projeto na Vercel (Storage → Connect to Project).'
    );
  }

  return new Redis({ url, token });
}

// ─── VAPID ────────────────────────────────────────────────────────────────────
function configureWebPush() {
  const publicKey  = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const mailto     = process.env.VAPID_MAILTO || 'mailto:admin@exemplo.com';

  if (!publicKey || !privateKey) {
    throw new Error(
      'Variáveis VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY não configuradas.\n' +
      'Gere as chaves com: npx web-push generate-vapid-keys'
    );
  }

  webpush.setVapidDetails(mailto, publicKey, privateKey);
  return { publicKey, privateKey };
}

// ─── ID de subscription ───────────────────────────────────────────────────────
function subscriptionId(endpoint) {
  return 'sub:' + Buffer.from(endpoint).toString('base64').slice(-24);
}

module.exports = { getRedis, configureWebPush, subscriptionId };
