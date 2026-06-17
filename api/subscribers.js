// GET /api/subscribers — Lista subscribers ativos
const { getRedis } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
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
    return res.status(500).json({ error: err.message });
  }
};
