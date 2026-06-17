// GET /api/vapid-public-key — Retorna a chave pública VAPID para o frontend
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return res.status(500).json({
      error: 'VAPID_PUBLIC_KEY não configurada. Adicione nas variáveis de ambiente da Vercel.',
    });
  }

  return res.status(200).json({ publicKey });
};
