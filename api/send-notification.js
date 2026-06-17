// POST /api/send-notification — Envia push para todos os subscribers
const webpush = require('web-push');
const { getRedis, configureWebPush } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    configureWebPush();
    const redis = getRedis();

    // Busca todos os IDs de subscriptions
    const ids = await redis.smembers('subscriptions:index');

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        error: 'Nenhum subscriber registrado. Ative as notificações primeiro.',
      });
    }

    const {
      title = '🔔 Notificação de Teste',
      body  = 'Esta notificação foi enviada pelo servidor na Vercel!',
      icon  = '/icon.png',
      badge = '/badge.png',
      url   = '/',
      tag   = 'test-notification',
    } = req.body;

    const payload = JSON.stringify({ title, body, icon, badge, url, tag });

    const results  = { success: 0, failed: 0, errors: [] };
    const toDelete = [];

    // Busca todas as subscriptions em paralelo
    const rawSubs = await Promise.all(ids.map(id => redis.get(id)));

    const sendPromises = rawSubs.map(async (raw, i) => {
      const id = ids[i];

      if (!raw) {
        // Subscription expirada ou inexistente
        toDelete.push(id);
        return;
      }

      let sub;
      try {
        sub = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        toDelete.push(id);
        return;
      }

      try {
        await webpush.sendNotification(sub, payload);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ id, message: err.message });

        // Remove subscriptions expiradas (410 Gone)
        if (err.statusCode === 410 || err.statusCode === 404) {
          toDelete.push(id);
        }
      }
    });

    await Promise.all(sendPromises);

    // Limpa subscriptions inválidas do Redis
    if (toDelete.length > 0) {
      await Promise.all([
        ...toDelete.map(id => redis.del(id)),
        redis.srem('subscriptions:index', ...toDelete),
      ]);
    }

    return res.status(200).json({
      success: true,
      stats: {
        total: ids.length,
        sent:  results.success,
        failed: results.failed,
        cleaned: toDelete.length,
      },
      errors: results.errors,
    });

  } catch (err) {
    console.error('[send-notification] Erro:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
