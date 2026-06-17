// GET /api/debug — Diagnóstico de variáveis de ambiente
// REMOVA ESTE ARQUIVO após resolver o problema!
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Mostra os NOMES das variáveis (não os valores) para diagnóstico
  const allKeys = Object.keys(process.env).sort();

  const vapid = {
    VAPID_PUBLIC_KEY:  process.env.VAPID_PUBLIC_KEY  ? '✅ definida' : '❌ ausente',
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ? '✅ definida' : '❌ ausente',
    VAPID_MAILTO:      process.env.VAPID_MAILTO      ? '✅ definida' : '❌ ausente',
  };

  // Filtra variáveis relacionadas ao Redis
  const redisKeys = allKeys.filter(k =>
    k.includes('REDIS') || k.includes('UPSTASH') || k.includes('KV_') || k.includes('STORAGE')
  );

  return res.status(200).json({
    vapid,
    redisVariablesFound: redisKeys,
    totalEnvVars: allKeys.length,
  });
};
