// GET /api/subscribers — Lista subscribers ativos
const { getRedis } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Redis ainda não configurado — retorna 0 sem erro
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return res.status(200).json({ count: 0, subscribers: [], warning: 'Redis não configurado' });
  }

  try {
    const redis = getRedis();
    const ids   = await redis.smembers('subscriptions:index');

    return res.status(200).json({
      count: ids ? ids.length : 0,
      subscribers: (ids || []).map(id => ({ id })),
    });

  } catch (err) {
    console.error('[subscribers] Erro:', err.message);
    // Falha no Redis não deve derrubar a UI — retorna 0
    return res.status(200).json({ count: 0, subscribers: [], warning: err.message });
  }
};
