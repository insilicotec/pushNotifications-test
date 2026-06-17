// ── Utilitário compartilhado: cliente Redis e VAPID ──────────────────────────
const { Redis } = require('@upstash/redis');
const webpush   = require('web-push');

// ─── Redis ────────────────────────────────────────────────────────────────────
function getRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Variáveis UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN não configuradas.\n' +
      'Crie um banco Redis na Vercel → Integrations → Upstash e adicione as variáveis de ambiente.'
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
