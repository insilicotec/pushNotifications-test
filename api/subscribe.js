// POST /api/subscribe — Salva uma subscription no Redis
const { getRedis, subscriptionId } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  // Verifica Redis antes de continuar
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(503).json({
      error: 'Banco de dados Redis não configurado. Adicione a integração Upstash na Vercel e faça redeploy.',
    });
  }

  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Subscription inválida: endpoint ausente.' });
  }

  try {
    const redis = getRedis();
    const id    = subscriptionId(subscription.endpoint);

    // Salva no Redis com TTL de 90 dias (renovado a cada acesso)
    await redis.set(id, JSON.stringify(subscription), { ex: 60 * 60 * 24 * 90 });

    // Adiciona o id ao índice geral de subscribers
    await redis.sadd('subscriptions:index', id);

    return res.status(201).json({ success: true, id });

  } catch (err) {
    console.error('[subscribe] Erro:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
