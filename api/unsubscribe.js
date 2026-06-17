// POST /api/unsubscribe — Remove uma subscription do Redis
const { getRedis, subscriptionId } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { endpoint } = req.body || {};

  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint é obrigatório.' });
  }

  try {
    const redis = getRedis();
    const id    = subscriptionId(endpoint);

    await redis.del(id);
    await redis.srem('subscriptions:index', id);

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[unsubscribe] Erro:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
