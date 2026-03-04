export default async function handler(req, res) {
  // Headers CORS essenciais (para permitir a própria origem do Vercel)
  const origin = req.headers.origin || '*';  // Use req.headers.origin para segurança futura
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Trata o preflight OPTIONS (obrigatório!)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const { total } = req.body;

  if (!total || isNaN(total)) {
    res.status(400).json({ error: 'Valor total inválido' });
    return;
  }

  try {
    const response = await fetch('https://api.infinitepay.io/invoices/public/checkout/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        handle: 'fernando1570',
        items: [
          {
            quantity: 1,
            price: Math.round(total * 100),
            description: 'Aluguel de hora(s) - Cardápio Digital'
          }
        ],
        order_nsu: 'pedido-' + Date.now()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `InfinitePay error: ${response.status} - ${errorText}` });
    }

    const data = await response.json();

    // Tente diferentes campos possíveis para o link (ajuste baseado no retorno real)
    const paymentUrl = data.link || data.checkout_url || data.payment_url || data.url || data.checkoutLink || data.redirectUrl;

    if (paymentUrl) {
      return res.status(200).json({ url: paymentUrl });
    } else {
      return res.status(500).json({ error: 'Link não encontrado na resposta. Resposta completa: ' + JSON.stringify(data) });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
}
