export default async function handler(req, res) {
  // Habilita CORS para qualquer origem (teste; depois restrinja se quiser)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Trata pré-voo CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { total } = req.body;

  if (!total || isNaN(total)) {
    return res.status(400).json({ error: 'Valor total inválido' });
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
      throw new Error(`InfinitePay retornou erro: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Ajuste o campo abaixo se o link vier em outro nome (veja logs do Vercel depois do teste)
    const paymentUrl = data.link || data.checkout_url || data.payment_url || data.url;

    if (paymentUrl) {
      res.status(200).json({ url: paymentUrl });
    } else {
      res.status(500).json({ error: 'Link não encontrado na resposta da InfinitePay. Resposta completa: ' + JSON.stringify(data) });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
