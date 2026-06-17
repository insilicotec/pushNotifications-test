// GET /api/vapid-public-key — Retorna a chave pública VAPID para o frontend
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const rawKey = process.env.VAPID_PUBLIC_KEY;

  if (!rawKey) {
    return res.status(500).json({
      error: 'VAPID_PUBLIC_KEY não configurada. Adicione nas variáveis de ambiente da Vercel.',
    });
  }

  // Sanitiza: remove aspas, espaços e padding "=" acidentais
  const publicKey = rawKey.trim().replace(/^["']|["']$/g, '').replace(/=+$/, '');

  return res.status(200).json({ publicKey });
};
